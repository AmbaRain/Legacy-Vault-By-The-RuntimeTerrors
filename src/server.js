const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const claimStatusRoutes = require('./routes/claimStatus');
const mockTriggerRoutes = require('./routes/mockTrigger');
const starknetIndexer = require('./services/starknetIndexer');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    mockStarknet: config.mockStarknet,
    mockStellar: config.mockStellar,
    usingMemoryStore: db.isUsingMemoryStore(),
  });
});

app.use('/api', claimStatusRoutes);
app.use('/api', mockTriggerRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function main() {
  await db.testConnection();

  app.listen(config.port, () => {
    console.log(`\nPollar bridge backend listening on http://localhost:${config.port}`);
    console.log(`Starknet leg: ${config.mockStarknet ? 'MOCK' : 'REAL'}`);
    console.log(`Stellar leg:  ${config.mockStellar ? 'MOCK' : 'REAL'}`);
    console.log(`Store: ${db.isUsingMemoryStore() ? 'in-memory (no Postgres connected)' : 'Postgres'}`);
    console.log('\nTry it:');
    console.log(`  curl -X POST http://localhost:${config.port}/api/mock/claim \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"beneficiaryIdentifier":"demo-user-1","amount":250}'`);
    console.log(`  curl http://localhost:${config.port}/api/vault/demo-user-1/claim-status\n`);
  });

  starknetIndexer.start();
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
