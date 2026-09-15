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
