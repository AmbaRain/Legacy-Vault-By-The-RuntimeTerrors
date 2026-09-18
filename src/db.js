const { Pool } = require('pg');
const config = require('./config');

// In mock mode with no DATABASE_URL configured, we still try to connect —
// if it fails, an in-memory fallback store kicks in (see below) so the
// whole demo can run without Postgres actually being installed.
let pool = null;
let useMemoryStore = false;
const memoryStore = new Map(); // remittance_id -> row

function getPool() {
  if (!pool && config.databaseUrl) {
    pool = new Pool({ connectionString: config.databaseUrl });
    pool.on('error', (err) => {
      console.error('[db] unexpected pg pool error', err.message);
    });
  }
  return pool;
}

async function testConnection() {
  const p = getPool();
  if (!p) {
    console.warn('[db] no DATABASE_URL set — falling back to in-memory store');
    useMemoryStore = true;
    return false;
  }
  try {
    await p.query('SELECT 1');
    return true;
  } catch (err) {
    console.warn(`[db] could not reach Postgres (${err.message}) — falling back to in-memory store`);
    useMemoryStore = true;
    return false;
  }
}

async function query(text, params) {
  if (useMemoryStore) {
    throw new Error('query() called while in memory-store fallback mode — use the memoryStore helpers instead');
  }
  const p = getPool();
  return p.query(text, params);
}

module.exports = {
  getPool,
  testConnection,
  query,
  isUsingMemoryStore: () => useMemoryStore,
  memoryStore,
};
