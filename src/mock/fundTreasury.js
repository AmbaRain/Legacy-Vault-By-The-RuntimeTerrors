/**
 * Generates a Stellar testnet keypair, funds it via Friendbot, and
 * establishes a USDC trustline on it (required before it can send OR
 * receive testnet USDC — Stellar accounts can't hold an asset they haven't
 * trusted).
 *
 * Usage:
 *   node src/mock/fundTreasury.js treasury     -> prints STELLAR_TREASURY_* for .env
 *   node src/mock/fundTreasury.js beneficiary  -> prints a test beneficiary keypair
 *                                                  to use as beneficiaryStellarPublicKey
 *                                                  when POSTing to /api/mock/claim
 *
 * (Requires network access — run this locally, not inside a sandboxed container.)
 */
const StellarSdk = require('@stellar/stellar-sdk');
const config = require('../config');

const label = process.argv[2] || 'treasury';

async function main() {
  const keypair = StellarSdk.Keypair.random();
  console.log(`Generated new Stellar testnet keypair (${label}):`);
  console.log(`  PUBLIC: ${keypair.publicKey()}`);
  console.log(`  SECRET: ${keypair.secret()}`);

  console.log('\nFunding via Friendbot...');
  const fundResp = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`);
  if (!fundResp.ok) {
    console.error('Friendbot funding failed:', await fundResp.text());
    process.exit(1);
  }
  console.log('Funded with testnet XLM.');

  if (!config.stellar.usdcIssuer) {
    console.warn('\nSTELLAR_USDC_ISSUER not set in .env — skipping trustline. Set it and rerun if you need one.');
  } else {
    console.log('\nEstablishing USDC trustline...');
    const server = new StellarSdk.Horizon.Server(config.stellar.horizonUrl);
    const account = await server.loadAccount(keypair.publicKey());
    const usdcAsset = new StellarSdk.Asset('USDC', config.stellar.usdcIssuer);

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset: usdcAsset }))
      .setTimeout(60)
      .build();

    tx.sign(keypair);
    await server.submitTransaction(tx);
    console.log('USDC trustline established.');
  }

  console.log(`\n--- Add to .env (${label}) ---`);
  if (label === 'treasury') {
    console.log(`STELLAR_TREASURY_PUBLIC=${keypair.publicKey()}`);
    console.log(`STELLAR_TREASURY_SECRET=${keypair.secret()}`);
  } else {
    console.log(`# Use this as "beneficiaryStellarPublicKey" in your POST /api/mock/claim body:`);
    console.log(`${keypair.publicKey()}`);
  }
}

main().catch((err) => {
  console.error('fundTreasury failed:', err.message);
  process.exit(1);
});
