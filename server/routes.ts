/**
 * API Routes for Cross-Chain Remittances and Claim Polling
 */

import { Router, Request, Response } from 'express';
import {
  getLatestRemittanceForVault,
  getRemittanceById,
  createRemittance,
  updateRemittanceState,
  listRemittances,
  findUserByBeneficiaryId,
} from './db';
import { starknetIndexer } from './indexer';

export const apiRouter = Router();

/**
 * Health check endpoint
 */
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    network: 'Starknet Sepolia <-> Stellar Testnet',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/vault/:address/claim-status
 * Status Polling Endpoint exposed for the frontend to poll during the claim process
 */
apiRouter.get('/vault/:address/claim-status', (req: Request, res: Response) => {
  const vaultAddress = req.params.address;
  if (!vaultAddress) {
    return res.status(400).json({ error: 'Vault address is required' });
  }

  const remittance = getLatestRemittanceForVault(vaultAddress);

  if (!remittance) {
    // Return empty / idle status if no claim initiated yet
    return res.json({
      status: 'idle',
      vault_address: vaultAddress,
      remittance: null,
      message: 'No active or historical claim found for this vault.',
    });
  }

  // Define structured pipeline steps for client visualization
  const steps = [
    {
      id: 'VAULT_FUNDED',
      name: 'Vault Inactivity Verified',
      completed: true,
      timestamp: remittance.created_at,
    },
    {
      id: 'STARKNET_CLAIMED',
      name: 'Starknet Contract Claim Executed',
      completed: [
        'STARKNET_CLAIMED',
        'STELLAR_SUBMITTED',
        'STELLAR_CONFIRMED',
        'COMPLETED',
      ].includes(remittance.state),
      tx_hash: remittance.starknet_tx_hash,
      timestamp: remittance.created_at,
    },
    {
      id: 'STELLAR_SUBMITTED',
      name: 'Stellar Settlement Dispatched',
      completed: ['STELLAR_SUBMITTED', 'STELLAR_CONFIRMED', 'COMPLETED'].includes(
        remittance.state
      ),
      tx_hash: remittance.stellar_tx_hash,
      timestamp: remittance.updated_at,
    },
    {
      id: 'STELLAR_CONFIRMED',
      name: 'Stellar Ledger Consensus Finalized',
      completed: ['STELLAR_CONFIRMED', 'COMPLETED'].includes(remittance.state),
      tx_hash: remittance.stellar_tx_hash,
      sep24_id: remittance.sep24_id,
      timestamp: remittance.updated_at,
    },
    {
      id: 'COMPLETED',
      name: 'Local Currency Payout Dispatched',
      completed: remittance.state === 'COMPLETED',
      timestamp: remittance.completed_at,
    },
  ];

  return res.json({
    status: 'success',
    vault_address: vaultAddress,
    state: remittance.state,
    remittance_id: remittance.remittance_id,
    remittance,
    steps,
    is_terminal: remittance.state === 'COMPLETED',
    can_offramp: remittance.state === 'STELLAR_CONFIRMED' || remittance.state === 'COMPLETED',
  });
});

/**
 * POST /api/vault/:address/claim
 * Frontend trigger endpoint to initiate claim and emit/index event
 */
apiRouter.post('/vault/:address/claim', async (req: Request, res: Response) => {
  const vaultAddress = req.params.address;
  const { beneficiary_identifier, amount_usdc } = req.body;

  const beneficiaryId =
    beneficiary_identifier ||
    'STELLAR_USER_BOLIVIA_01';
  const amount = parseFloat(amount_usdc) || 1250.0;

  console.info(`[API] Received claim trigger for vault ${vaultAddress}, beneficiary: ${beneficiaryId}`);

  // Generate realistic Starknet transaction hash
  const starknetTxHash = `0x05f8${Array.from({ length: 60 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  // Ingest via Indexer
  const remittance = await starknetIndexer.ingestClaimEvent({
    vault_owner: vaultAddress,
    bridge_treasury: '0x048e7184ff1049281a8b438290184bfe2410381f',
    beneficiary_identifier: beneficiaryId,
    usdc_amount: amount,
    target_network: 'STELLAR',
    timestamp: Math.floor(Date.now() / 1000),
    starknet_tx_hash: starknetTxHash,
  });

  return res.json({
    status: 'success',
    message: 'Claim indexed and Stellar settlement initiated',
    remittance,
  });
});

/**
 * POST /api/indexer/ingest-event
 * Directly ingest an InheritanceClaimed event payload
 */
apiRouter.post('/indexer/ingest-event', async (req: Request, res: Response) => {
  try {
    const {
      vault_owner,
      bridge_treasury,
      beneficiary_identifier,
      usdc_amount,
      starknet_tx_hash,
    } = req.body;

    if (!vault_owner || !beneficiary_identifier) {
      return res.status(400).json({ error: 'vault_owner and beneficiary_identifier are required' });
    }

    const remittance = await starknetIndexer.ingestClaimEvent({
      vault_owner,
      bridge_treasury: bridge_treasury || '0x048e7184ff1049281a8b438290184bfe2410381f',
      beneficiary_identifier,
      usdc_amount: parseFloat(usdc_amount) || 1250,
      target_network: 'STELLAR',
      timestamp: Math.floor(Date.now() / 1000),
      starknet_tx_hash: starknet_tx_hash || `0x${Date.now().toString(16)}`,
    });

    return res.json({ status: 'success', remittance });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/remittances/:id/complete
 * Updates state to COMPLETED once Pollar SEP-24 / Busha local payout completes
 */
apiRouter.post('/remittances/:id/complete', (req: Request, res: Response) => {
  const remittanceId = req.params.id;
  const { sep24_id, payout_details } = req.body;

  try {
    const updated = updateRemittanceState(remittanceId, 'COMPLETED', {
      ...(sep24_id ? { sep24_id } : {}),
      metadata: {
        ...(payout_details || {}),
      },
    });

    return res.json({ status: 'success', remittance: updated });
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

/**
 * GET /api/remittances
 * List all remittances
 */
apiRouter.get('/remittances', (req: Request, res: Response) => {
  const list = listRemittances();
  res.json({ count: list.length, remittances: list });
});
