/**
 * CLI helper — fires a mock InheritanceClaimed event against a RUNNING
 * local server (must be started separately with `npm start`).
 *
 * Usage:
 *   node src/mock/emitMockEvent.js user-123 250
 *
 * Then watch the server logs, and poll:
 *   curl http://localhost:4000/api/vault/user-123/claim-status
 */
require('dotenv').config();

const port = process.env.PORT || 4000;
const beneficiaryIdentifier = process.argv[2] || `demo-user-${Date.now()}`;
const amount = process.argv[3] ? Number(process.argv[3]) : 100;

async function main() {
  const res = await fetch(`http://localhost:${port}/api/mock/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ beneficiaryIdentifier, amount }),
  });

  const body = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(body);
  console.log(`\nNow poll: curl http://localhost:${port}/api/vault/${beneficiaryIdentifier}/claim-status`);
}

main().catch((err) => {
  console.error('Failed to emit mock event. Is the server running (npm start)?');
  console.error(err.message);
  process.exit(1);
});
