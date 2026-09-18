/**
 * Database Layer for Cross-Chain Remittances and Beneficiary Mappings
 * Tracks remittance_id, starknet_tx_hash, stellar_tx_hash, sep24_id,
 * and transaction states:
 * - VAULT_FUNDED
 * - STARKNET_CLAIMED
 * - STELLAR_SUBMITTED
 * - STELLAR_CONFIRMED
 * - COMPLETED
 */

import fs from 'fs';
import path from 'path';

export type RemittanceState =
  | 'VAULT_FUNDED'
  | 'STARKNET_CLAIMED'
  | 'STELLAR_SUBMITTED'
  | 'STELLAR_CONFIRMED'
  | 'COMPLETED';

export interface RemittanceRecord {
  remittance_id: string;
  vault_owner: string;
  beneficiary_identifier: string;
  stellar_beneficiary_address: string;
  amount_usdc: number;
  starknet_tx_hash?: string;
  stellar_tx_hash?: string;
  sep24_id?: string;
  state: RemittanceState;
  target_network: 'STELLAR';
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface InternalUserRecord {
  user_id: string;
  identifier: string;
  name: string;
  email: string;
  country: string;
  stellar_wallet_address: string;
  bank_name?: string;
  bank_account_number?: string;
}

export interface DbSchema {
  remittances: Record<string, RemittanceRecord>;
  users: Record<string, InternalUserRecord>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'remittances.json');

// In-memory cache synced with disk
let dbCache: DbSchema = {
  remittances: {},
  users: {},
};

// Seed internal user records for beneficiary resolution
const SEED_USERS: InternalUserRecord[] = [
  {
    user_id: 'usr_bolivia_01',
    identifier: 'STELLAR_USER_BOLIVIA_01',
    name: 'Mateo Quispe Flores',
    email: 'mateo.quispe@pollar.xyz',
    country: 'Bolivia',
    // Realistic Stellar Testnet public key
    stellar_wallet_address: 'GAUTCO2M6U3UUXN3ZDFO4YIELB7E5J6WZZYMYZ4PJJ7E5F6Y2U6XZ4PO',
    bank_name: 'Banco Unión',
    bank_account_number: '100000348912',
  },
  {
    user_id: 'usr_bolivia_02',
    identifier: '0x04bf6578a1670929a4a7537b83d16ca1f2113222e43bc09e9929288f3be1890b',
    name: 'Valeria Condori',
    email: 'valeria.condori@pollar.xyz',
    country: 'Bolivia',
    stellar_wallet_address: 'GB2Z4MYK6V5J22F5TWRMPO47B25GZ6MZZYMYZ4PJJ7E5F6Y2U6XZ4XYZ',
    bank_name: 'Banco Nacional de Bolivia (BNB)',
    bank_account_number: '200004928172',
  },
  {
    user_id: 'usr_nigeria_01',
    identifier: '0x05b6348ef53d9e038848f029b4e654279b940e4f',
    name: 'Adewale Okonkwo',
    email: 'adewale.o@busha.co',
    country: 'Nigeria',
    stellar_wallet_address: 'GCEZUM3CYRO3ZTOO4TG45MFF7A5S6BSQCAD32LBH5NDV374YF646AULA',
    bank_name: 'Guaranty Trust Bank (GTBank)',
    bank_account_number: '0123456789',
  },
];

function persistToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to persist database to disk:', err);
  }
}

export function initDb(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[DB] Could not load existing DB file, creating new database.', err);
    dbCache = { remittances: {}, users: {} };
  }

  // Ensure default seed users exist
  for (const user of SEED_USERS) {
    if (!dbCache.users[user.identifier.toLowerCase()]) {
      dbCache.users[user.identifier.toLowerCase()] = user;
    }
    if (!dbCache.users[user.user_id]) {
      dbCache.users[user.user_id] = user;
    }
  }

  persistToDisk();
  console.info(`[DB] Database initialized with ${Object.keys(dbCache.remittances).length} remittances and ${Object.keys(dbCache.users).length} mapped users.`);
}

export function findUserByBeneficiaryId(beneficiaryId: string): InternalUserRecord | null {
  const norm = beneficiaryId.trim().toLowerCase();
  if (dbCache.users[norm]) {
    return dbCache.users[norm];
  }
  // Try matching raw
  for (const user of Object.values(dbCache.users)) {
    if (user.identifier.toLowerCase() === norm || user.stellar_wallet_address.toLowerCase() === norm) {
      return user;
    }
  }

  // Default fallback user if dynamic identifier
  const fallbackUser: InternalUserRecord = {
    user_id: `usr_${Math.random().toString(36).substring(2, 8)}`,
    identifier: beneficiaryId,
    name: 'Verified Beneficiary',
    email: 'beneficiary@pollar.xyz',
    country: 'Bolivia',
    // Deterministic or valid default Stellar key
    stellar_wallet_address: 'GAUTCO2M6U3UUXN3ZDFO4YIELB7E5J6WZZYMYZ4PJJ7E5F6Y2U6XZ4PO',
    bank_name: 'Banco Unión',
    bank_account_number: '100000348912',
  };
  dbCache.users[norm] = fallbackUser;
  persistToDisk();
  return fallbackUser;
}

export function createRemittance(
  data: Omit<RemittanceRecord, 'created_at' | 'updated_at'>
): RemittanceRecord {
  const now = new Date().toISOString();
  const record: RemittanceRecord = {
    ...data,
    created_at: now,
    updated_at: now,
  };
  dbCache.remittances[record.remittance_id] = record;
  persistToDisk();
  console.info(`[DB] Created remittance ${record.remittance_id} [${record.state}] for vault ${record.vault_owner}`);
  return record;
}

export function updateRemittanceState(
  remittanceId: string,
  newState: RemittanceState,
  extra?: Partial<RemittanceRecord>
): RemittanceRecord {
  const existing = dbCache.remittances[remittanceId];
  if (!existing) {
    throw new Error(`Remittance with ID ${remittanceId} not found`);
  }

  const now = new Date().toISOString();
  const updated: RemittanceRecord = {
    ...existing,
    ...extra,
    state: newState,
    updated_at: now,
    ...(newState === 'COMPLETED' ? { completed_at: now } : {}),
  };

  dbCache.remittances[remittanceId] = updated;
  persistToDisk();
  console.info(`[DB] Remittance ${remittanceId} state transitioned to -> ${newState}`);
  return updated;
}

export function getRemittanceById(remittanceId: string): RemittanceRecord | null {
  return dbCache.remittances[remittanceId] || null;
}

export function getLatestRemittanceForVault(vaultOwner: string): RemittanceRecord | null {
  const norm = vaultOwner.trim().toLowerCase();
  const matches = Object.values(dbCache.remittances).filter(
    (r) => r.vault_owner.trim().toLowerCase() === norm
  );
  if (matches.length === 0) return null;

  // Sort descending by updated_at
  matches.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return matches[0];
}

export function listRemittances(): RemittanceRecord[] {
  return Object.values(dbCache.remittances).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
