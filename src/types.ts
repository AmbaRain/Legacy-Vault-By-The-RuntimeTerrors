export type AssetSymbol = 'ETH' | 'STRK' | 'USDC';

export interface AssetInfo {
  symbol: AssetSymbol;
  name: string;
  decimals: number;
  referenceUsd: number;
  tint: string;
}

export interface UserProfile {
  id: string;
  email: string;
  wallet_address?: string;
  network: string;
  wallet_source: 'generated' | 'connected';
  onboarding_complete: boolean;
}

export interface Balance {
  asset: AssetSymbol;
  amount: number;
}

export type TransactionKind = 'deposit' | 'withdraw' | 'send' | 'receive' | 'bridge' | 'legacy';
export type TransactionStatus =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'confirmed'
  | 'active'
  | 'warning'
  | 'eligible'
  | 'executed'
  | 'not_configured'
  | 'paused'
  | 'submitted'
  | 'wallet_confirmation';

export interface Transaction {
  id: string;
  kind: TransactionKind;
  asset: AssetSymbol;
  amount: number;
  fee: number;
  fee_asset?: string;
  status: TransactionStatus;
  created_at: string;
  network: string;
  from_address?: string;
  to_address?: string;
  tx_hash?: string;
  failure_reason?: string;
}

export type LegacyStatus =
  | 'active'
  | 'warning'
  | 'eligible'
  | 'executed'
  | 'not_configured'
  | 'paused';

export interface LegacyProtection {
  next_of_kin: string;
  dormancy_days: number;
  gas_reserve: number;
  gas_reserve_asset: string;
  status: LegacyStatus;
  last_qualifying_activity: string;
  executed_at?: string | null;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: string;
  qualifying: boolean;
  created_at: string;
}

export interface VaultData {
  profile: UserProfile | null;
  balances: Balance[];
  transactions: Transaction[];
  legacy?: LegacyProtection | null;
  activity: ActivityItem[];
}

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

export interface ClaimPipelineStep {
  id: RemittanceState;
  name: string;
  completed: boolean;
  tx_hash?: string;
  sep24_id?: string;
  timestamp?: string;
}

export interface ClaimStatusResponse {
  status: 'idle' | 'success' | 'error';
  vault_address?: string;
  state?: RemittanceState;
  remittance_id?: string;
  remittance?: RemittanceRecord | null;
  steps?: ClaimPipelineStep[];
  is_terminal?: boolean;
  can_offramp?: boolean;
}

