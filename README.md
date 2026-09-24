# Legacy Vault

> **Your Crypto. Your Legacy.**  
> A non-custodial Starknet smart wallet platform for programmable cryptocurrency inheritance, automated heartbeat protection (dead-man's switch), Starknet–Stellar cross-chain bridging, and multi-currency fiat on/off-ramps (Busha NGN & Pollar SEP-24 Bolivian anchor).

---

## 🌟 Key Features

- **Programmable Inheritance & Dead-Man's Switch**:
  - Non-custodial inheritance vaults deployed natively on Starknet Layer 2.
  - Configurable inactivity timers (30, 90, 180, 365 days) with automated and manual heartbeat aliveness checks.
  - Gas reserve allocation allowing heirs to claim assets gaslessly via native Paymasters.
  - Protection pause/resume modes for travel, military deployment, or medical hiatus.
- **Starknet ↔ Stellar Cross-Chain Bridging**:
  - High-speed liquidity bridge bridging assets between Starknet L2 and Stellar network.
  - Near-instant finality with automated cross-network transaction indexing.
- **Multi-Rail Fiat On/Off-Ramps**:
  - **Busha NGN Off-Ramp**: Direct off-ramping to Nigerian bank accounts (NGN) via instant settlement rails.
  - **Pollar SEP-24 Bolivian Anchor**: Interactive deposit and withdrawal gateway for Bolivian fiat currency using Stellar's SEP-24 standard.
  - **Paystack Payment Gateway**: Direct card and bank transfer on-ramp for African fiat currencies.
- **Full Asset Management Suite**:
  - Portfolio tracking across ETH, STRK, and USDC.
  - Send, Receive, Deposit, and Withdraw flows with real-time fee calculation.
  - Comprehensive on-chain transaction history with explorer integration.
- **Production-Ready & Resilient**:
  - React 19 + TypeScript + Tailwind CSS v4 + Motion animations.
  - Zero-flicker client error boundaries to prevent unexpected blank screens.
  - Hybrid full-stack architecture: Express dev/production server + Vercel serverless API bridge.

---

## 🏗 Architecture Overview

Legacy Vault connects client-side account abstraction on Starknet with off-chain indexers, payment gateways, and Stellar settlement rails:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Legacy Vault Client                            │
│           (React 19 + TypeScript + Tailwind CSS + Lucide + Motion)       │
└──────────────┬──────────────────────────┬───────────────────────────────┘
               │                          │
               ▼ JSON-RPC                 ▼ REST / Serverless
┌──────────────────────────────┐  ┌───────────────────────────────────────┐
│     Starknet L2 Network      │  │        Legacy Vault Backend / API     │
│   (Sepolia Testnet / RPC)    │  │     (Express / Vercel Serverless)     │
│                              │  │                                       │
│  ┌────────────────────────┐  │  ├───────────────────┬───────────────────┤
│  │   Legacy Vault Cairo   │  │  │  Transaction     │  Remittance Cache │
│  │ (Custodian & Heartbeat)│  │  │  Event Indexer    │  & Auth Store     │
│  └────────────────────────┘  │  └─────────┬─────────┴─────────┬─────────┘
└──────────────┬───────────────┘            │                   │
               │                            ▼                   ▼
               │                  ┌──────────────────┐ ┌──────────────────┐
               │ Bridge Engine    │   Busha / Paystack│ │  Pollar SEP-24   │
               └─────────────────►│   (NGN Off-Ramp) │ │ (Bolivian Anchor)│
                                  └──────────────────┘ └──────────────────┘
```

---

## 🚀 Quick Start & Local Development

### Prerequisites

- **Node.js**: v20+ (v22 recommended) or **Bun**
- **npm** or **bun**
- (Optional for smart contract development): **Scarb** & **Starknet Foundry (`snforge`)**

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/legacy-vault.git
cd legacy-vault
npm install
```

### 2. Environment Configuration

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `GEMINI_API_KEY` | Optional AI capabilities key | Injected by AI Studio |
| `APP_URL` | Base application URL | `http://localhost:3000` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key for card on-ramp | `pk_test_...` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key for webhook verification | `sk_test_...` |
| `BUSHA_SECRET_KEY` | Busha crypto off-ramp secret | `YOUR_SECRET_TOKEN` |
| `VITE_BUSHA_API_KEY` | Busha public test API key | `test_bsh_sec_...` |
| `STELLAR_HORIZON_URL` | Stellar network horizon endpoint | `https://horizon-testnet.stellar.org` |
| `STELLAR_NETWORK` | Stellar network passphrase | `Test SDF Network ; September 2015` |
| `STELLAR_TREASURY_SECRET` | Stellar bridge relayer secret key | *Optional for local dev* |
| `STELLAR_USDC_ISSUER` | Stellar testnet USDC issuer address | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| `STARKNET_RPC_URL` | Starknet Sepolia JSON-RPC provider | `https://starknet-sepolia.public.blastapi.io/rpc/v0_7` |
| `STARKNET_VAULT_CONTRACT_ADDRESS` | Deployed Cairo contract address | `0x07b7194ffba17045b78b5ce534346e01a88dbce04c632876615b138ff40c4a45` |

### 3. Run Development Server

```bash
npm run dev
```

The application will start on **`http://localhost:3000`**, serving both the Vite client frontend and Express API routes under `/api/*`.

### 4. Build for Production

```bash
npm run build
```

This compiles:
1. Static client assets via Vite into `dist/` (with vendor chunking for `starknet` and UI libraries).
2. Standalone Node.js server bundle via esbuild into `dist/server.cjs`.

To preview the built production server locally:
```bash
npm run start
```

### 5. Typecheck & Linting

```bash
npm run lint
```

---

## ☁️ Deployment Guide (Vercel)

This repository is optimized for one-click deployment on **Vercel** with full support for both client-side Single Page Application (SPA) routing and serverless `/api/*` endpoints.

### Deployment Configuration (`vercel.json`)

The project includes an explicit `vercel.json` configuration:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/((?!assets/|media/|favicon.ico|api/|.*\\.[a-zA-Z0-9]+$).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Key Vercel Setup Steps:

1. **Framework Preset**: Vercel automatically detects `Vite`. Ensure the output directory is set to `dist`.
2. **Build Command**: `npm run build`
3. **Environment Variables**: Add your environment variables in the Vercel Project Settings (refer to `.env.example`).
4. **Serverless Functions**: The `/api/index.ts` file acts as the serverless bridge connecting all Express API routes automatically on Vercel without requiring a long-running Node server.
5. **Static Assets & SPA Rewrites**: The rewrite rule ensures static `.js`, `.css`, and images in `/assets` load without being redirected to `index.html`.

---

## 🧭 Application Routes & Pages

| Route | Page Component | Description |
|---|---|---|
| `/` | `LandingPage.tsx` | High-converting landing page highlighting Starknet security, AA, and inheritance features. |
| `/welcome` | `WelcomePage.tsx` | Welcome gateway for new and returning users. |
| `/onboarding/*` | `onboarding/*.tsx` | 4-step onboarding wizard: create vault, secure seed phrase, verify, and initialize. |
| `/auth` | `AuthPage.tsx` | Email/password sign-in and biometric/passkey connection portal. |
| `/dashboard` | `DashboardPage.tsx` | Central vault command center with balance overview, dormancy countdown, and fast ping. |
| `/assets` | `AssetsPage.tsx` | Multi-asset portfolio view (ETH, STRK, USDC) with allocation analytics. |
| `/send` | `SendPage.tsx` | Send assets to any Starknet address or contract. |
| `/receive` | `ReceivePage.tsx` | Receive crypto with QR code and shareable Starknet address. |
| `/deposit` | `DepositPage.tsx` | On-ramp and deposit assets using cards, Paystack, or crypto transfers. |
| `/withdraw` | `WithdrawPage.tsx` | Off-ramp crypto to fiat bank accounts via Busha (NGN) or Pollar (BOB). |
| `/bridge` | `BridgePage.tsx` | Cross-chain bridge interface for Starknet ↔ Stellar network swaps. |
| `/activity` | `ActivityPage.tsx` | Real-time transaction history, heartbeat log, and pending executions. |
| `/tx/:id` | `TransactionDetailPage.tsx` | Deep-dive transaction view with fee breakdown and explorer links. |
| `/legacy-protection` | `LegacyProtectionPage.tsx` | Heartbeat management, emergency pause toggle, and dormancy status monitor. |
| `/legacy-setup` | `LegacySetupPage.tsx` | Multi-step inheritance setup: designate beneficiary, set window, fund gas reserve. |
| `/claim` | `BeneficiaryClaimPortal.tsx` | Heir claims portal to inspect eligibility and execute claim with sponsored gas. |
| `/how-it-works` | `HowItWorksPage.tsx` | Step-by-step explainer of Starknet Cairo vaults and dead-man's switch logic. |
| `/security` | `SecurityPage.tsx` | Detailed technical audit and security posture overview. |
| `/settings` | `SettingsPage.tsx` | User preferences, notification webhook settings, and wallet management. |

---

## 📜 Smart Contract Specification (Cairo)

The smart contracts are located in `contracts/` and written in Cairo for Starknet:

### Storage Layout (`LegacyVault.cairo`)

```cairo
#[storage]
struct Storage {
    // Owner of the vault
    owner: ContractAddress,
    // Designated beneficiary (next-of-kin)
    beneficiary: ContractAddress,
    // Duration in seconds of allowed inactivity (e.g., 90 days = 7,776,000s)
    dormancy_period: u64,
    // Timestamp of the latest qualifying on-chain heartbeat
    last_heartbeat: u64,
    // Gas reserve balance allocated for autonomous beneficiary claim execution
    gas_reserve: u256,
    // Token address used for gas reserve (STRK or ETH)
    gas_reserve_token: ContractAddress,
    // Flag to temporarily halt the countdown (e.g., during medical/travel hiatus)
    is_paused: bool,
    // Flag indicating whether inheritance has been transferred
    is_claimed: bool,
}
```

### View & Mutative Methods

- `configure_inheritance(beneficiary, dormancy_days, gas_reserve_amount, gas_reserve_token)`: Configures beneficiary and deposits gas reserve.
- `send_heartbeat()`: Updates `last_heartbeat` to current block timestamp; proves the owner is alive.
- `pause_inheritance()` / `resume_inheritance()`: Temporarily freezes or unfreezes the dormancy clock.
- `claim_inheritance(vault_owner)`: Allows beneficiary (or automated keeper) to claim assets once dormancy duration has elapsed without a heartbeat.
- `is_claim_eligible(vault_owner)`: Pure view returning `true` if `block_timestamp > last_heartbeat + dormancy_period`.

### Running Cairo Tests

To test the Cairo contracts using Starknet Foundry:

```bash
cd contracts
./test.sh
# or directly:
snforge test
```

---

## ⚡ Starknet Advantages & Account Abstraction

Legacy Vault exploits several unique architectural advantages of Starknet:
1. **Native Account Abstraction (AA)**: Every account is a smart contract. No complex EOA escrow wrappers required.
2. **Native Multicalls**: Batch token approval, gas deposit, and inheritance configuration in a single atomic transaction.
3. **Paymasters & Gasless Claims**: Beneficiaries with zero crypto experience or zero balance can claim their inheritance sponsored by the vault's pre-funded gas reserve.
4. **Low Execution Cost**: Heartbeat pings cost fractions of a cent ($0.001–$0.005), enabling frequent check-ins without friction.

---

## 🛡 Security & Production Resilience

- **Client Error Boundaries**: Protects against unexpected unhandled rendering exceptions, ensuring the user interface always presents recovery options.
- **Rollup Chunk Optimization**: Heavy cryptographic SDKs (`starknet`) and animation engines are split into dedicated cache chunks for rapid initial load.
- **Non-Custodial Architecture**: Private keys and seed phrases remain strictly client-side or within Starknet account contracts.

---

## 📄 License

MIT License. Designed and engineered for the decentralized future.
