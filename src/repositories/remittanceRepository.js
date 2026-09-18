const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function nowIso() {
  return new Date().toISOString();
}

async function createRemittance({ beneficiaryIdentifier, ownerAddress, amountUsdc, beneficiaryStellarPublicKey }) {
  if (db.isUsingMemoryStore()) {
    const row = {
      remittance_id: uuidv4(),
      beneficiary_identifier: beneficiaryIdentifier,
      owner_address: ownerAddress || null,
      beneficiary_stellar_public_key: beneficiaryStellarPublicKey || null,
      starknet_tx_hash: null,
      stellar_tx_hash: null,
      sep24_id: null,
      amount_usdc: amountUsdc || null,
      status: 'VAULT_FUNDED',
      failure_reason: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.memoryStore.set(row.remittance_id, row);
    return row;
  }

  const result = await db.query(
    `INSERT INTO remittances (beneficiary_identifier, owner_address, amount_usdc, beneficiary_stellar_public_key)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [beneficiaryIdentifier, ownerAddress || null, amountUsdc || null, beneficiaryStellarPublicKey || null]
  );
  return result.rows[0];
}

async function setBeneficiaryStellarPublicKey(remittanceId, stellarPublicKey) {
  if (db.isUsingMemoryStore()) {
    const row = db.memoryStore.get(remittanceId);
    if (!row) return null;
    row.beneficiary_stellar_public_key = stellarPublicKey;
    row.updated_at = nowIso();
    db.memoryStore.set(remittanceId, row);
    return row;
  }

  const result = await db.query(
    `UPDATE remittances SET beneficiary_stellar_public_key = $2 WHERE remittance_id = $1 RETURNING *`,
    [remittanceId, stellarPublicKey]
  );
  return result.rows[0] || null;
}

async function findByBeneficiary(beneficiaryIdentifier) {
  if (db.isUsingMemoryStore()) {
    return [...db.memoryStore.values()]
      .filter((r) => r.beneficiary_identifier === beneficiaryIdentifier)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const result = await db.query(
    `SELECT * FROM remittances WHERE beneficiary_identifier = $1 ORDER BY created_at DESC`,
    [beneficiaryIdentifier]
  );
  return result.rows;
}

async function findLatestByOwnerOrBeneficiary(address) {
  if (db.isUsingMemoryStore()) {
    const matches = [...db.memoryStore.values()]
      .filter((r) => r.owner_address === address || r.beneficiary_identifier === address)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return matches[0] || null;
  }

  const result = await db.query(
    `SELECT * FROM remittances
     WHERE owner_address = $1 OR beneficiary_identifier = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [address]
  );
  return result.rows[0] || null;
}

async function updateStatus(remittanceId, status, fields = {}) {
  const { starknetTxHash, stellarTxHash, sep24Id, failureReason } = fields;

  if (db.isUsingMemoryStore()) {
    const row = db.memoryStore.get(remittanceId);
    if (!row) return null;
    row.status = status;
    if (starknetTxHash !== undefined) row.starknet_tx_hash = starknetTxHash;
    if (stellarTxHash !== undefined) row.stellar_tx_hash = stellarTxHash;
    if (sep24Id !== undefined) row.sep24_id = sep24Id;
    if (failureReason !== undefined) row.failure_reason = failureReason;
    row.updated_at = nowIso();
    db.memoryStore.set(remittanceId, row);
    return row;
  }

  const result = await db.query(
    `UPDATE remittances
     SET status = $2,
         starknet_tx_hash = COALESCE($3, starknet_tx_hash),
         stellar_tx_hash = COALESCE($4, stellar_tx_hash),
         sep24_id = COALESCE($5, sep24_id),
         failure_reason = COALESCE($6, failure_reason)
     WHERE remittance_id = $1
     RETURNING *`,
    [remittanceId, status, starknetTxHash || null, stellarTxHash || null, sep24Id || null, failureReason || null]
  );
  return result.rows[0] || null;
}

async function findById(remittanceId) {
  if (db.isUsingMemoryStore()) {
    return db.memoryStore.get(remittanceId) || null;
  }
  const result = await db.query(`SELECT * FROM remittances WHERE remittance_id = $1`, [remittanceId]);
  return result.rows[0] || null;
}

module.exports = {
  createRemittance,
  findByBeneficiary,
  findLatestByOwnerOrBeneficiary,
  updateStatus,
  findById,
  setBeneficiaryStellarPublicKey,
};
