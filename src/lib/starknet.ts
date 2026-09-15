/**
 * Starknet SDK & Cairo Smart Contract Adapter for Legacy Vault
 *
 * This module exports configured Starknet.js providers, account abstractions,
 * and contract interface stubs matching the expectant Cairo inheritance contract.
 *
 * NOTE: This is pre-wired and ready for your deployed contract address and ABI.
 */

import { RpcProvider, Account, Contract, Call, uint256, constants } from 'starknet';

// -------------------------------------------------------------------------
// Network Configuration
// -------------------------------------------------------------------------

export const STARKNET_NETWORKS = {
  SEPOLIA: {
    nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
    chainId: constants.StarknetChainId.SN_SEPOLIA,
  },
  MAINNET: {
    nodeUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
    chainId: constants.StarknetChainId.SN_MAIN,
  },
};

export const defaultProvider = new RpcProvider({
  nodeUrl: STARKNET_NETWORKS.SEPOLIA.nodeUrl,
});

// -------------------------------------------------------------------------
// Cairo Smart Contract Types & Structs (Matching Cairo 2.x interface)
// -------------------------------------------------------------------------

export interface CairoInheritanceConfig {
  beneficiary: string;        // ContractAddress (felt252)
  dormancy_period_secs: number; // u64
  gas_reserve_amount: string; // u256
  gas_reserve_token: string;  // ContractAddress
  is_active: boolean;         // bool
  last_heartbeat_timestamp: number; // u64
}

export interface CairoClaimStatus {
  is_eligible: boolean;
  seconds_remaining: number;
  last_heartbeat: number;
  beneficiary: string;
}

// -------------------------------------------------------------------------
// Expectant Contract ABI Interface Skeleton
// -------------------------------------------------------------------------

export const INHERITANCE_VAULT_ABI = [
  // Views (Read calls)
  {
    type: 'function',
    name: 'get_inheritance_config',
    inputs: [{ name: 'vault_owner', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'config', type: 'LegacyVault::InheritanceConfig' }],
    state_mutability: 'view',
  },
  {
    type: 'function',
    name: 'get_last_heartbeat',
    inputs: [{ name: 'vault_owner', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'timestamp', type: 'core::integer::u64' }],
    state_mutability: 'view',
  },
  {
    type: 'function',
    name: 'is_claim_eligible',
    inputs: [{ name: 'vault_owner', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'eligible', type: 'core::bool' }],
    state_mutability: 'view',
  },
  {
    type: 'function',
    name: 'get_gas_reserve',
    inputs: [{ name: 'vault_owner', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [
      { name: 'amount', type: 'core::integer::u256' },
      { name: 'token', type: 'core::starknet::contract_address::ContractAddress' }
    ],
    state_mutability: 'view',
  },
  // Externals (State modifying transactions)
  {
    type: 'function',
    name: 'configure_inheritance',
    inputs: [
      { name: 'beneficiary', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'dormancy_days', type: 'core::integer::u64' },
      { name: 'gas_reserve_amount', type: 'core::integer::u256' },
      { name: 'gas_reserve_token', type: 'core::starknet::contract_address::ContractAddress' },
    ],
    outputs: [],
    state_mutability: 'external',
  },
  {
    type: 'function',
    name: 'send_heartbeat',
    inputs: [],
    outputs: [],
    state_mutability: 'external',
  },
  {
    type: 'function',
    name: 'pause_inheritance',
    inputs: [],
    outputs: [],
    state_mutability: 'external',
  },
  {
    type: 'function',
    name: 'resume_inheritance',
    inputs: [],
    outputs: [],
    state_mutability: 'external',
  },
  {
    type: 'function',
    name: 'claim_inheritance',
    inputs: [{ name: 'vault_owner', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [],
    state_mutability: 'external',
  },
  {
    type: 'function',
    name: 'withdraw_gas_reserve',
    inputs: [{ name: 'recipient', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [],
    state_mutability: 'external',
  },
];

// -------------------------------------------------------------------------
// Call Builders for Starknet Account Multicall Execution
// -------------------------------------------------------------------------

/**
 * Builds on-chain calls that the frontend dispatches to the contract.
 * Use these with `account.execute(calls)` to exploit Starknet's native multicall.
 */
export const ContractCallBuilder = {
  configureInheritance(
    contractAddress: string,
    beneficiary: string,
    dormancyDays: number,
    gasReserveAmount: string,
    gasReserveToken: string
  ): Call {
    const amountU256 = uint256.bnToUint256(gasReserveAmount);
    return {
      contractAddress,
      entrypoint: 'configure_inheritance',
      calldata: [
        beneficiary,
        dormancyDays.toString(),
        amountU256.low.toString(),
        amountU256.high.toString(),
        gasReserveToken,
      ],
    };
  },

  sendHeartbeat(contractAddress: string): Call {
    return {
      contractAddress,
      entrypoint: 'send_heartbeat',
      calldata: [],
    };
  },

  pauseInheritance(contractAddress: string): Call {
    return {
      contractAddress,
      entrypoint: 'pause_inheritance',
      calldata: [],
    };
  },

  resumeInheritance(contractAddress: string): Call {
    return {
      contractAddress,
      entrypoint: 'resume_inheritance',
      calldata: [],
    };
  },

  claimInheritance(contractAddress: string, vaultOwner: string): Call {
    return {
      contractAddress,
      entrypoint: 'claim_inheritance',
      calldata: [vaultOwner],
    };
  },
};

/**
 * Helper to get a typed contract instance once deployed
 */
export function getInheritanceContract(contractAddress: string, accountOrProvider?: Account | RpcProvider) {
  return new Contract({
    abi: INHERITANCE_VAULT_ABI,
    address: contractAddress,
    providerOrAccount: accountOrProvider || defaultProvider,
  });
}
