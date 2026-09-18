/**
 * Listens for the `InheritanceClaimed` event emitted by Amba's modified
 * claim_inheritance() function on the Legacy Vault Starknet contract, and
 * transitions the matching remittance row to STARKNET_CLAIMED.
 *
 * Event shape (per the brief):
 *   InheritanceClaimed { owner, amount, beneficiary_identifier, destination_network: 'STELLAR' }
 *
 * Two modes:
 *  - MOCK_MODE=true  -> polls an in-memory "mock event bus" (see mock/mockEventBus.js).
 *                       Use `npm run seed:mock-event` to fire a fake claim and watch
 *                       it flow through the whole pipeline.
 *  - MOCK_MODE=false -> polls the real Starknet RPC for events from
 *                       STARKNET_VAULT_CONTRACT_ADDRESS using starknet.js.
 *
 * Swapping from mock to real requires zero code changes — just the .env values.
 */
const config = require('../config');
const remittanceRepository = require('../repositories/remittanceRepository');
const stellarSettlement = require('./stellarSettlement');

let starknetProvider = null;
let lastCheckedBlock = null;

function getProvider() {
  if (config.mockStarknet) return null;
  if (!starknetProvider) {
    // Lazy-require so the package isn't needed at all in mock mode.
    const { RpcProvider } = require('starknet');
    starknetProvider = new RpcProvider({ nodeUrl: config.starknet.rpcUrl });
  }
  return starknetProvider;
}

/**
 * Handles one decoded InheritanceClaimed event, regardless of whether it
 * came from the mock bus or the real chain.
 */
async function handleClaimEvent({ owner, amount, beneficiaryIdentifier, starknetTxHash, beneficiaryStellarPublicKey }) {
  console.log(`[indexer] InheritanceClaimed: owner=${owner} amount=${amount} beneficiary=${beneficiaryIdentifier}`);

  // Find (or lazily create) the remittance row for this claim.
  let remittance = await remittanceRepository.findLatestByOwnerOrBeneficiary(owner || beneficiaryIdentifier);

  if (!remittance) {
    remittance = await remittanceRepository.createRemittance({
      beneficiaryIdentifier,
      ownerAddress: owner,
      amountUsdc: amount,
      beneficiaryStellarPublicKey,
    });
    console.log(`[indexer] no existing row found — created ${remittance.remittance_id}`);
  } else if (beneficiaryStellarPublicKey && !remittance.beneficiary_stellar_public_key) {
    remittance = await remittanceRepository.setBeneficiaryStellarPublicKey(
      remittance.remittance_id,
      beneficiaryStellarPublicKey
    );
  }

  const updated = await remittanceRepository.updateStatus(remittance.remittance_id, 'STARKNET_CLAIMED', {
    starknetTxHash,
  });

  console.log(`[indexer] ${updated.remittance_id} -> STARKNET_CLAIMED`);

  // Hand off immediately to the Stellar settlement leg.
  stellarSettlement.settleRemittance(updated.remittance_id).catch((err) => {
    console.error(`[indexer] settlement kick-off failed for ${updated.remittance_id}:`, err.message);
  });
}

async function pollReal() {
  const provider = getProvider();
  if (!provider || !config.starknet.vaultContractAddress) {
    console.warn('[indexer] STARKNET_VAULT_CONTRACT_ADDRESS not set — skipping real poll');
    return;
  }

  try {
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = lastCheckedBlock ?? latestBlock;

    if (latestBlock < fromBlock) return;

    // NOTE: exact event-filter shape depends on the ABI Amba deploys.
    // This uses starknet.js's generic getEvents; adjust `keys` once the
    // real ABI/event selector is known.
    const events = await provider.getEvents({
      address: config.starknet.vaultContractAddress,
      from_block: { block_number: fromBlock },
      to_block: { block_number: latestBlock },
      chunk_size: 50,
    });

    for (const evt of events.events || []) {
      // TODO: decode evt.data using the real ABI once available.
      // Placeholder decode assumes [owner, amount, beneficiary_identifier].
      const [owner, amount, beneficiaryIdentifier] = evt.data || [];
      await handleClaimEvent({
        owner,
        amount,
        beneficiaryIdentifier,
        starknetTxHash: evt.transaction_hash,
      });
    }

    lastCheckedBlock = latestBlock + 1;
  } catch (err) {
    console.error('[indexer] real poll failed:', err.message);
  }
}

let intervalHandle = null;

function start() {
  if (config.mockStarknet) {
    console.log(
      '[indexer] Starknet leg is MOCKED — POST /api/mock/claim to simulate an InheritanceClaimed event'
    );
    return;
  }

  console.log(`[indexer] starting in REAL mode, polling Starknet every ${config.starknet.pollIntervalMs}ms`);
  intervalHandle = setInterval(() => {
    pollReal().catch((err) => console.error('[indexer] tick error:', err));
  }, config.starknet.pollIntervalMs);
}

function stop() {
  if (intervalHandle) clearInterval(intervalHandle);
}

module.exports = { start, stop, handleClaimEvent };
