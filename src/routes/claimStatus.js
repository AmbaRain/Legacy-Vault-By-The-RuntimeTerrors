const express = require('express');
const remittanceRepository = require('../repositories/remittanceRepository');

const router = express.Router();

/**
 * GET /api/vault/:address/claim-status
 *
 * :address can be the Starknet owner address OR the beneficiary_identifier —
 * whichever the frontend has on hand when it starts polling.
 *
 * Response shape kept intentionally simple for the frontend's polling screen
 * (STARKNET_CLAIMED -> STELLAR_SUBMITTED -> STELLAR_CONFIRMED) so it knows
 * exactly when to call openRampModal().
 */
router.get('/vault/:address/claim-status', async (req, res) => {
  const { address } = req.params;

  try {
    const remittance = await remittanceRepository.findLatestByOwnerOrBeneficiary(address);

    if (!remittance) {
      return res.status(404).json({
        found: false,
        message: 'No remittance found for this address yet.',
      });
    }

    return res.json({
      found: true,
      remittance_id: remittance.remittance_id,
      status: remittance.status,
      starknet_tx_hash: remittance.starknet_tx_hash,
      stellar_tx_hash: remittance.stellar_tx_hash,
      sep24_id: remittance.sep24_id,
      amount_usdc: remittance.amount_usdc,
      failure_reason: remittance.failure_reason,
      ready_for_pollar_ramp: remittance.status === 'STELLAR_CONFIRMED' || remittance.status === 'COMPLETED',
      updated_at: remittance.updated_at,
    });
  } catch (err) {
    console.error('[route] claim-status error:', err);
    return res.status(500).json({ found: false, message: 'Internal error checking claim status.' });
  }
});

module.exports = router;
