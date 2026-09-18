/**
 * Once a remittance is STARKNET_CLAIMED, this signs and submits a Stellar
 * testnet USDC payment from the treasury account to the beneficiary's
 * Pollar Stellar wallet, then marks the remittance STELLAR_CONFIRMED.
 *
 * MOCK_MODE=true fabricates a plausible-looking tx hash instead of hitting
 * Stellar testnet, so the full pipeline (and the frontend polling it) can
 * be demoed without real treasury credentials configured yet.
 */
const config = require('../config');
const remittanceRepository = require('../repositories/remittanceRepository');

async function mockSettle(remittanceId) {
  // Simulate network latency so status transitions are visible in a demo/UI.
  await new Promise((res) => setTimeout(res, 1500));
  const fakeTxHash = `stellar_mock_${Date.now().toString(16)}`;

  await remittanceRepository.updateStatus(remittanceId, 'STELLAR_SUBMITTED', {
    stellarTxHash: fakeTxHash,
  });

  await new Promise((res) => setTimeout(res, 1000));

  const updated = await remittanceRepository.updateStatus(remittanceId, 'STELLAR_CONFIRMED', {
    stellarTxHash: fakeTxHash,
  });

  console.log(`[stellar:mock] ${remittanceId} -> STELLAR_CONFIRMED (tx=${fakeTxHash})`);
  return updated;
}

async function realSettle(remittanceId) {
  // Lazy-require so the SDK isn't needed at all in mock mode.
  const StellarSdk = require('@stellar/stellar-sdk');

  const remittance = await remittanceRepository.findById(remittanceId);
  if (!remittance) throw new Error(`remittance ${remittanceId} not found`);

  if (!config.stellar.treasurySecret || !config.stellar.treasuryPublic) {
    throw new Error('STELLAR_TREASURY_SECRET / STELLAR_TREASURY_PUBLIC not configured');
  }

  // NOTE: this assumes the beneficiary's Stellar public key is resolvable
  // from their Pollar account. Until the Pollar team confirms how to fetch
  // that (see "Important Questions for the Pollar Team" #5/#20 in the brief),
  // beneficiaryStellarPublicKey must be supplied via the Pollar SDK call site.
  const beneficiaryStellarPublicKey = remittance.beneficiary_stellar_public_key;
  if (!beneficiaryStellarPublicKey) {
    throw new Error(
      'No beneficiary Stellar public key on file yet — wire this up once Pollar confirms how wallets are resolved'
    );
  }

  const server = new StellarSdk.Horizon.Server(config.stellar.horizonUrl);
  const networkPassphrase =
    config.stellar.network === 'TESTNET' ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;

  const treasuryKeypair = StellarSdk.Keypair.fromSecret(config.stellar.treasurySecret);
  const treasuryAccount = await server.loadAccount(config.stellar.treasuryPublic);

  const usdcAsset = new StellarSdk.Asset('USDC', config.stellar.usdcIssuer);

  const tx = new StellarSdk.TransactionBuilder(treasuryAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: beneficiaryStellarPublicKey,
        asset: usdcAsset,
        amount: String(remittance.amount_usdc || '0'),
      })
    )
    .setTimeout(60)
    .build();

  tx.sign(treasuryKeypair);

  await remittanceRepository.updateStatus(remittanceId, 'STELLAR_SUBMITTED');

  const result = await server.submitTransaction(tx);

  const updated = await remittanceRepository.updateStatus(remittanceId, 'STELLAR_CONFIRMED', {
    stellarTxHash: result.hash,
  });

  console.log(`[stellar] ${remittanceId} -> STELLAR_CONFIRMED (tx=${result.hash})`);
  return updated;
}

async function settleRemittance(remittanceId) {
  try {
    const settled = config.mockStellar ? await mockSettle(remittanceId) : await realSettle(remittanceId);

    // Final step: mark COMPLETED once Stellar is confirmed. In the real
    // flow this might instead wait for the Pollar SEP-24 off-ramp to
    // finish — flip this once that's confirmed with the Pollar team.
    await remittanceRepository.updateStatus(remittanceId, 'COMPLETED');
    return settled;
  } catch (err) {
    console.error(`[stellar] settlement failed for ${remittanceId}:`, err.message);
    await remittanceRepository.updateStatus(remittanceId, 'FAILED', { failureReason: err.message });
    throw err;
  }
}

module.exports = { settleRemittance };
