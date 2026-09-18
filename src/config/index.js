require('dotenv').config();

function bool(val, fallback) {
  if (val === undefined) return fallback;
  return String(val).toLowerCase() === 'true';
}

// MOCK_MODE is the master switch (defaults both legs to mock). Each leg can
// also be overridden independently — e.g. MOCK_STARKNET=true + MOCK_STELLAR=false
// simulates the Starknet claim (no deployed contract needed yet) while
// executing a REAL signed payout on Stellar testnet. That combination is
// exactly what you want to demo the real half of the bridge tonight.
const masterMock = bool(process.env.MOCK_MODE, true);

module.exports = {
  port: process.env.PORT || 4000,
  mockMode: masterMock, // kept for back-compat / the /health endpoint
  mockStarknet: bool(process.env.MOCK_STARKNET, masterMock),
  mockStellar: bool(process.env.MOCK_STELLAR, masterMock),

  databaseUrl: process.env.DATABASE_URL,

  starknet: {
    rpcUrl: process.env.STARKNET_RPC_URL,
    vaultContractAddress: process.env.STARKNET_VAULT_CONTRACT_ADDRESS,
    pollIntervalMs: Number(process.env.STARKNET_POLL_INTERVAL_MS || 5000),
  },

  stellar: {
    network: process.env.STELLAR_NETWORK || 'TESTNET',
    horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    treasurySecret: process.env.STELLAR_TREASURY_SECRET,
    treasuryPublic: process.env.STELLAR_TREASURY_PUBLIC,
    usdcIssuer: process.env.STELLAR_USDC_ISSUER,
  },

  pollar: {
    baseUrl: process.env.POLLAR_API_BASE_URL || 'https://sandbox.pollar.xyz',
    apiKey: process.env.POLLAR_API_KEY,
  },
};
