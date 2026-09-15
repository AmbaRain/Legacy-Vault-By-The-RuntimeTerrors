# Legacy Vault — Technical Specification & Starknet Integration Guide

> **Your Crypto. Your Legacy.**  
> A non-custodial Starknet platform for programmable cryptocurrency inheritance, daily asset management, and dead-man's-switch heartbeat protection.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Expected Backend API Endpoints](#2-expected-backend-api-endpoints)
3. [Expected Smart Contract Specification (Cairo)](#3-expected-smart-contract-specification-cairo)
4. [Expectant Frontend → Contract Call List](#4-expectant-frontend--contract-call-list)
5. [Starknet Strategic Advisory & Exploitation Plan](#5-starknet-strategic-advisory--exploitation-plan)
6. [Frontend SDK Adapter](#6-frontend-sdk-adapter)

---

## 1. Architecture Overview

Legacy Vault operates as a hybrid decentralized application:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + `starknet` SDK.
- **Smart Contract Layer**: Deployed on Starknet (Cairo 2.x), executing non-custodial asset custody, heartbeat timers, and beneficiary claims.
- **Off-Chain Indexer / Backend**: Tracks on-chain heartbeats, manages notification emails, provides price oracles, and monitors dormancy states off-chain.

```
┌─────────────────────────────────────────────────────────────┐
│                      Legacy Vault Frontend                   │
│          (React 19 + Starknet.js + Lucide Icons)             │
└──────────────┬───────────────────────────────┬──────────────┘
               │ JSON-RPC calls                │ REST / WebSocket
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│    Starknet L2 RPC Node      │ │     Legacy Vault Backend    │
│   (Sepolia / Mainnet RPC)    │ │   (Auth, Telemetry, Alerts) │
└──────────────┬───────────────┘ └─────────────┬───────────────┘
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│   Legacy Vault Cairo Contract│ │  PostgreSQL / Redis Indexer │
│ (Custodian, Timer, Multicall)│ └─────────────────────────────┘
└──────────────────────────────┘
```

---

## 2. Expected Backend API Endpoints

The backend supports off-chain operations, user authentication, notification alerts before dormancy triggers, and transaction indexing.

### 2.1 Authentication & Profile
| Method | Endpoint | Description | Request Payload | Response Payload |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register user email & encrypt backup metadata | `{ "email": string, "password_hash": string }` | `{ "user_id": string, "token": string }` |
| `POST` | `/api/auth/login` | Authenticate existing user | `{ "email": string, "password_hash": string }` | `{ "user_id": string, "token": string, "profile": object }` |
| `GET` | `/api/user/profile` | Get connected vault metadata | Header: `Bearer <token>` | `{ "user_id": string, "email": string, "wallet_address": string, "created_at": string }` |
| `POST` | `/api/user/wallet` | Associate deployed Starknet vault address | `{ "wallet_address": string, "network": "sepolia" \| "mainnet" }` | `{ "success": boolean }` |

### 2.2 Heartbeat & Monitoring Service
| Method | Endpoint | Description | Request Payload | Response Payload |
|---|---|---|---|---|
| `GET` | `/api/vault/:address/status` | Read cached vault dormancy state & countdown | None | `{ "address": string, "status": "active" \| "warning" \| "eligible" \| "executed" \| "paused", "last_heartbeat": number, "dormancy_seconds": number, "seconds_remaining": number }` |
| `POST` | `/api/vault/:address/notify-settings` | Configure email/telegram warning threshold | `{ "warning_days_before": number, "alert_email": string }` | `{ "success": boolean }` |
| `POST` | `/api/indexer/heartbeat-sync` | Webhook triggered when an on-chain heartbeat occurs | `{ "tx_hash": string, "vault_address": string, "timestamp": number }` | `{ "recorded": boolean }` |

### 2.3 Transaction Indexer & Oracle
| Method | Endpoint | Description | Request Payload | Response Payload |
|---|---|---|---|---|
| `GET` | `/api/vault/:address/transactions` | Query indexed Starknet transactions | Query: `?page=1&limit=20&asset=ETH` | `{ "total": number, "items": Transaction[] }` |
| `GET` | `/api/oracle/prices` | Reference spot prices for ETH, STRK, USDC | None | `{ "ETH": 3100.50, "STRK": 0.45, "USDC": 1.00 }` |
| `POST` | `/api/bridge/quote` | Estimate L1 ↔ L2 bridge fees and arrival time | `{ "asset": string, "amount": string, "direction": "l1_to_l2" \| "l2_to_l1" }` | `{ "estimated_fee": string, "estimated_minutes": number }` |

---

## 3. Expected Smart Contract Specification (Cairo)

The smart contract can be written either as a standalone **Inheritance Module (Validator/Hook)** or as a **Full Custom Account Abstraction Vault**. Below is the interface for the Cairo contract:

### 3.1 Storage Variables
```cairo
#[storage]
struct Storage {
    // Owner of the vault
    owner: ContractAddress,
    // Beneficiary who receives the inheritance
    beneficiary: ContractAddress,
    // Duration in seconds of allowed inactivity before claims open (e.g., 30 days = 2,592,000s)
    dormancy_period: u64,
    // Timestamp of the most recent qualifying transaction or heartbeat
    last_heartbeat: u64,
    // Gas reserve balance allocated for autonomous beneficiary claim execution
    gas_reserve: u256,
    // Token used for gas reserve (e.g., STRK or ETH)
    gas_reserve_token: ContractAddress,
    // Flag to temporarily halt countdown (e.g., during military leave or medical hiatus)
    is_paused: bool,
    // Flag set to true once inheritance has been completely executed
    is_claimed: bool,
}
```

### 3.2 View Functions (Read-Only)
| Function Signature | Return Type | Purpose |
|---|---|---|
| `get_inheritance_config(vault_owner: ContractAddress)` | `InheritanceConfig` struct | Returns beneficiary address, dormancy period, gas reserve, and status. |
| `get_last_heartbeat(vault_owner: ContractAddress)` | `u64` | Returns UNIX timestamp of the latest qualifying on-chain activity. |
| `is_claim_eligible(vault_owner: ContractAddress)` | `bool` | Evaluates if `block_timestamp > last_heartbeat + dormancy_period` and not paused/claimed. |
| `get_time_until_dormant(vault_owner: ContractAddress)` | `u64` | Returns seconds left until inheritance claim opens. |
| `get_gas_reserve(vault_owner: ContractAddress)` | `(u256, ContractAddress)` | Returns current gas reserve balance and token address. |

### 3.3 External Functions (State Mutations)
| Function Signature | Caller Requirement | Purpose |
|---|---|---|
| `configure_inheritance(beneficiary, dormancy_days, gas_reserve_amount, gas_reserve_token)` | Vault Owner | Registers or updates the next-of-kin beneficiary, dormancy window, and funds the gas reserve. |
| `send_heartbeat()` | Vault Owner | Explicitly updates `last_heartbeat = get_block_timestamp()` to prove aliveness. |
| `pause_inheritance()` | Vault Owner | Temporarily suspends dormancy countdown. |
| `resume_inheritance()` | Vault Owner | Resumes dormancy countdown, resetting `last_heartbeat` to current timestamp. |
| `claim_inheritance(vault_owner: ContractAddress)` | Beneficiary (or Keeper) | Transports vault assets to beneficiary once `is_claim_eligible == true`. |
| `withdraw_gas_reserve(recipient: ContractAddress)` | Vault Owner | Allows the owner to refund unused gas reserve tokens back to their personal wallet. |

### 3.4 Events Emitted
```cairo
#[event]
#[derive(Drop, starknet::Event)]
enum Event {
    InheritanceConfigured: InheritanceConfigured,
    HeartbeatReceived: HeartbeatReceived,
    InheritancePaused: InheritancePaused,
    InheritanceResumed: InheritanceResumed,
    InheritanceClaimed: InheritanceClaimed,
    GasReserveRefunded: GasReserveRefunded,
}
```

---

## 4. Expectant Frontend → Contract Call List

The frontend expects to dispatch the following transactions and views. All calls are codified in `src/lib/starknet.ts`.

### 4.1 Read Calls (Polling & View Renders)
1. **`get_inheritance_config(vaultOwner)`**
   - **Trigger**: Mounted when entering `/legacy-protection`, `/dashboard`, or `/settings`.
   - **Expectation**: Populates beneficiary address, configured dormancy days, and pause status.
2. **`is_claim_eligible(vaultOwner)`**
   - **Trigger**: Periodic health check or when a designated beneficiary enters claim mode.
   - **Expectation**: Dictates whether the "Claim Inheritance" UI is enabled or locked.
3. **`get_last_heartbeat(vaultOwner)`**
   - **Trigger**: Drives the live countdown timer and warning badge on the Activity page.

### 4.2 Write Calls (User Interactions)
1. **`configure_inheritance(...)`**
   - **Frontend Source**: `LegacySetupPage.tsx` (Step 4 Submit).
   - **Calldata**: `[beneficiary_address, dormancy_days, gas_reserve_low, gas_reserve_high, token_address]`.
   - **Multicall Note**: Preceded by an `erc20.approve` call if depositing gas reserve in the same transaction.
2. **`send_heartbeat()`**
   - **Frontend Source**: `ActivityPage.tsx` ("Send Heartbeat Ping" button).
   - **Calldata**: `[]`.
   - **Expectation**: Low fee (~$0.005), resets timer to 100%.
3. **`pause_inheritance()` / `resume_inheritance()`**
   - **Frontend Source**: `LegacyProtectionPage.tsx` ("Pause Protection" toggle).
   - **Calldata**: `[]`.
4. **`claim_inheritance(vaultOwner)`**
   - **Frontend Source**: Beneficiary Claim Portal.
   - **Calldata**: `[vault_owner_address]`.
   - **Execution**: Can be sponsored via Paymaster so the beneficiary pays zero initial gas.

---

## 5. Starknet Strategic Advisory & Exploitation Plan

Starknet is uniquely suited for a programmable inheritance protocol due to architectural advantages not found on standard EVM chains:

### 1. Native Account Abstraction (AA)
- **Traditional EVM Problem**: On Ethereum L1, wallets are EOAs (Externally Owned Accounts). EOAs cannot execute logic without a signature from a private key. If the owner passes away or loses keys, no code can ever touch the assets.
- **Starknet Advantage**: *Every account on Starknet is natively a smart contract*. There are no EOAs.
- **How to Exploit in Legacy Vault**:
  - The Legacy Vault itself is an Account Contract (`__validate__` and `__execute__`).
  - In `__validate__`, you can enforce custom rules: *"Valid if signed by Owner OR (signed by Beneficiary AND block_timestamp > last_heartbeat + dormancy)"*.
  - This completely removes the need for awkward wrapped escrow vaults. The user holds their funds directly in their primary account.

### 2. Native Multicall (Atomic Batching)
- **Traditional EVM Problem**: To configure inheritance with token deposits, users sign 2–3 separate transactions (Approve token, Deposit, Configure timer).
- **Starknet Advantage**: Native batch execution allows sending an array of `Call[]` in a single signature.
- **How to Exploit in Legacy Vault**:
  - In `LegacySetupPage`, combine `approve(gas_reserve)`, `transfer(gas_reserve)`, and `configure_inheritance` into **one atomic multicall**. The user confirms only once in their wallet.
  - When the inheritance executes, the contract can distribute ETH, STRK, and USDC to the heir in a single block without multiple withdrawal steps.

### 3. Paymasters & Fee Abstraction (Gasless Claims)
- **Traditional Problem**: If an heir has never used crypto, they won't have ETH or STRK to pay gas fees to submit a `claim_inheritance()` transaction.
- **Starknet Advantage**: Native Paymaster architecture allows third parties (or the vault's gas reserve) to sponsor transaction fees, or allows paying gas in USDC.
- **How to Exploit in Legacy Vault**:
  - Use the pre-funded **Gas Reserve** to sponsor the beneficiary's claim transaction via an AVNU or Cartridge Paymaster. The heir can claim their inheritance with a completely empty wallet balance.

### 4. Session Keys & Autonomous Keepers
- **Traditional Problem**: Dead-man's-switches usually require someone to manually click "Claim" after death.
- **Starknet Advantage**: Starknet supports constrained Session Keys (temporary cryptographic credentials with strict execution parameters).
- **How to Exploit in Legacy Vault**:
  - Allow an autonomous off-chain Keeper (or Cartridge Controller) to hold a session key restricted solely to calling `execute_dormancy_transfer()` once the time condition is verified by the STARK prover.

### 5. Validity Proofs & Cheap Storage
- **Starknet Advantage**: Computation and storage verification scale logarithmically with STARK proofs.
- **How to Exploit in Legacy Vault**:
  - Daily heartbeat pings cost fractions of a cent ($0.001–$0.005), making frequent aliveness signals practically free compared to Ethereum L1 ($5–$25 per ping).

---

## 6. Frontend SDK Adapter

The official `starknet` SDK is already installed in the application.

A dedicated bridge adapter is provided in `src/lib/starknet.ts`:
```typescript
import { ContractCallBuilder, getInheritanceContract } from '@/lib/starknet';

// 1. Build a multicall to configure inheritance
const call = ContractCallBuilder.configureInheritance(
  VAULT_CONTRACT_ADDRESS,
  beneficiaryAddress,
  90, // 90 days dormancy
  gasReserveAmount,
  STRK_TOKEN_ADDRESS
);

// 2. Dispatch via connected Starknet account
const tx = await account.execute([call]);
await provider.waitForTransaction(tx.transaction_hash);
```

When you deploy your Cairo contract, update `VAULT_CONTRACT_ADDRESS` with your deployed address on Sepolia or Mainnet to transition seamlessly from simulated mock states to live on-chain execution.
