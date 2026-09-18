# Pollar Bridge Backend (AVRON's part)

Bridges a Starknet `InheritanceClaimed` event from the Legacy Vault contract
to a Stellar testnet USDC payout, exposing a status endpoint the frontend
polls until it's time to open the Pollar SEP-24 modal.

```
Starknet vault claim
   -> InheritanceClaimed event
   -> [this service] Starknet indexer -> DB: STARKNET_CLAIMED
   -> [this service] Stellar settlement -> DB: STELLAR_SUBMITTED -> STELLAR_CONFIRMED -> COMPLETED
   -> Frontend polls GET /api/vault/:address/claim-status
   -> When ready_for_pollar_ramp = true, frontend opens Pollar SEP-24 modal
```

---

## Part 1 — Install (do this once)

You need [Node.js](https://nodejs.org) 18+ installed. Then:

```bash
unzip pollar-bridge-backend.zip
cd pollar-backend
npm install
cp .env.example .env
```

Leave `.env` untouched for now — the defaults work with zero configuration.

---

## Part 2 — Run it

```bash
npm start
```

You should see:
```
Pollar bridge backend listening on http://localhost:4000
Starknet leg: MOCK
Stellar leg:  MOCK
Store: in-memory (no Postgres connected)
```

That's a fully working backend, right now, with no database, no blockchain
credentials, nothing else installed. This is the fastest way to prove the
API works and to let the frontend start building against it today.

---

## Part 3 — Test it step by step

Open a **second terminal** (leave the server running in the first one).

**Step 1 — confirm it's alive:**
```bash
curl http://localhost:4000/health
```
Expect: `{"ok":true,"mockStarknet":true,"mockStellar":true,"usingMemoryStore":true}`

**Step 2 — simulate a claim** (this stands in for Amba's contract firing the
real event):
```bash
curl -X POST http://localhost:4000/api/mock/claim \
  -H "Content-Type: application/json" \
  -d '{"beneficiaryIdentifier":"demo-user-1","amount":250}'
```
Expect: `{"ok":true,"message":"Mock InheritanceClaimed event processed."}`

**Step 3 — poll the status** (this is the exact call the frontend makes):
```bash
curl http://localhost:4000/api/vault/demo-user-1/claim-status
```
Run it 2-3 times a couple seconds apart. You'll see `status` move:
`STARKNET_CLAIMED` → `STELLAR_SUBMITTED` → `STELLAR_CONFIRMED` → `COMPLETED`.

If all three steps work, the backend is proven end to end on its own.

---

## Part 4 — Two mock switches, not one

There are two independent legs, each with its own mock switch in `.env`:

```bash
MOCK_STARKNET=true    # true = simulate claims via /api/mock/claim
                       # false = poll the real deployed contract
MOCK_STELLAR=true     # true = fake payout, no real transaction
                       # false = REAL signed payment on Stellar testnet
```

**The useful combo for right now**, before Amba's contract is deployed but
once you want a real result to show: `MOCK_STARKNET=true` +
`MOCK_STELLAR=false`. You simulate the Starknet trigger, but the money
movement on Stellar is real and verifiable on a block explorer.

### Making the Stellar leg real

This needs two funded testnet accounts: a **treasury** (pays out) and a
**beneficiary** (receives). Both need testnet XLM and a USDC trustline —
the helper script does all of that:

```bash
node src/mock/fundTreasury.js treasury
```
Copy the printed `STELLAR_TREASURY_PUBLIC` / `STELLAR_TREASURY_SECRET` into
`.env`.

```bash
node src/mock/fundTreasury.js beneficiary
```
Copy the printed public key — you'll pass it in as
`beneficiaryStellarPublicKey` below.

**One thing Friendbot can't do:** it funds XLM, not USDC. Your treasury
account needs an actual USDC balance before it can pay anyone. On Stellar
testnet, get test USDC from the Stellar Laboratory's test asset tools or
ask in the Stellar Discord's testnet channel — this is a manual step,
document it as such in your demo notes if you don't have time to automate it.

Then in `.env`:
```bash
MOCK_STARKNET=true
MOCK_STELLAR=false
```

Restart the server, then trigger a claim **with** the beneficiary key:
```bash
curl -X POST http://localhost:4000/api/mock/claim \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryIdentifier": "demo-user-1",
    "amount": 10,
    "beneficiaryStellarPublicKey": "G...(from the beneficiary script above)"
  }'
```

Poll status as before. Once `STELLAR_CONFIRMED`, the `stellar_tx_hash` field
is a real transaction hash — paste it into
`https://stellar.expert/explorer/testnet/tx/<hash>` and you'll see a real,
verifiable payment. This is the strongest thing you can show a judge.

### Making the Starknet leg real (once Amba deploys)

```bash
MOCK_STARKNET=false
STARKNET_VAULT_CONTRACT_ADDRESS=0x...   # from Amba
```

One code change is still needed: `src/services/starknetIndexer.js` has a
`// TODO` where event decoding assumes `[owner, amount, beneficiary_identifier]`
as positional data. Confirm the real layout with Amba's ABI and adjust that
one function — nothing else in the pipeline changes.

---

## Part 5 — Using a real database instead of in-memory

```bash
# .env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```
```bash
npm run migrate
```
This is optional for the demo (in-memory works fine for a single-session
demo) but recommended if you're testing over multiple days or the process
might restart.

---

## Part 6 — Handing this to the frontend

No code merging needed — backend and frontend are two separate running
programs that talk over HTTP. Whoever owns integration needs:

1. This backend running and reachable (`localhost:4000` while testing
   together in person, or deployed to something like Railway/Render if
   you need it reachable from elsewhere).
2. The frontend's API base URL pointed at that address.
3. The frontend calling `GET /api/vault/:address/claim-status` and reading
   the `status` and `ready_for_pollar_ramp` fields.

That JSON shape is the entire contract between the two halves:

```json
{
  "found": true,
  "remittance_id": "uuid",
  "status": "STELLAR_CONFIRMED",
  "starknet_tx_hash": "0x...",
  "stellar_tx_hash": "...",
  "sep24_id": null,
  "amount_usdc": 250,
  "ready_for_pollar_ramp": true,
  "updated_at": "2026-09-17T..."
}
```

When you're ready to test together: start the backend, have the frontend
person point their app at it, fire a `/api/mock/claim` (or a real claim if
you're that far along), and watch both sides update live.

---

## API Reference

### `GET /api/vault/:address/claim-status`
`:address` can be the Starknet owner address or the beneficiary identifier.

### `POST /api/mock/claim`
```json
{
  "beneficiaryIdentifier": "demo-user-1",
  "owner": "0xabc",
  "amount": 250,
  "beneficiaryStellarPublicKey": "G..."
}
```
`owner` and `amount` are optional (randomized/defaulted if omitted).
`beneficiaryStellarPublicKey` is only needed when `MOCK_STELLAR=false`.
Returns 403 if `MOCK_STARKNET=false` (real events are expected instead).

### `GET /health`
Reports which legs are mocked and which data store is active.

---

## Project layout

```
src/
  config/index.js               env config — mockStarknet / mockStellar flags
  db.js                          Postgres pool + in-memory fallback
  migrations/
    001_create_remittances.sql   the remittances table
    run.js                       npm run migrate
  repositories/
    remittanceRepository.js      all DB reads/writes go through here
  services/
    starknetIndexer.js           listens for InheritanceClaimed (mock or real)
    stellarSettlement.js         pays beneficiary USDC on Stellar (mock or real)
  routes/
    claimStatus.js                GET /api/vault/:address/claim-status
    mockTrigger.js                 POST /api/mock/claim
  mock/
    emitMockEvent.js               CLI helper: node src/mock/emitMockEvent.js <id> <amount>
    fundTreasury.js                 CLI helper: node src/mock/fundTreasury.js [treasury|beneficiary]
  server.js                       wires it all together, starts the indexer
```

## What's still open

- **Testnet USDC funding for the treasury** — Friendbot gives XLM, not USDC;
  getting real testnet USDC into the treasury account is a manual step (see
  Part 4).
- **Event ABI** — the real Starknet event decode is a placeholder until
  Amba's actual contract ABI is available.
- **Pollar SEP-24 call** — this backend hands off readiness via
  `ready_for_pollar_ramp: true`; actually calling `openRampModal()` is the
  frontend's job per the team's task list.
