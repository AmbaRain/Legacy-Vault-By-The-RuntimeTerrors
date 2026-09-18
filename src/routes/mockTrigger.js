/**
 * DEMO / MOCK_MODE ONLY.
 *
 * Lets you (or the frontend, or a curl command) simulate the moment Amba's
 * contract fires InheritanceClaimed, without a real deployed contract.
 * This is how you rehearse the full pipeline tonight before the real
 * contract address is wired in.
 *
 * POST /api/mock/claim
 * body: {
 *   "beneficiaryIdentifier": "user-123",
 *   "owner": "0xabc",
 *   "amount": 250,
 *   "beneficiaryStellarPublicKey": "G..."   // optional — only needed if MOCK_MODE=false,
 *                                            // so the real Stellar settlement has somewhere to pay
 * }
 */
const express = require('express');
const config = require('../config');
const starknetIndexer = require('../services/starknetIndexer');

const router = express.Router();

router.post('/mock/claim', async (req, res) => {
  if (!config.mockStarknet) {
    return res.status(403).json({
      error:
        'Mock trigger is disabled — MOCK_STARKNET=false means real Starknet events are expected instead',
    });
  }

  const { beneficiaryIdentifier, owner, amount, beneficiaryStellarPublicKey } = req.body || {};

  if (!beneficiaryIdentifier) {
    return res.status(400).json({ error: 'beneficiaryIdentifier is required' });
  }

  try {
    await starknetIndexer.handleClaimEvent({
      owner: owner || `0xmockOwner${Math.floor(Math.random() * 9999)}`,
      amount: amount ?? 100,
      beneficiaryIdentifier,
      starknetTxHash: `0xmock${Date.now().toString(16)}`,
      beneficiaryStellarPublicKey,
    });

    return res.json({ ok: true, message: 'Mock InheritanceClaimed event processed.' });
  } catch (err) {
    console.error('[route] mock claim trigger failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
