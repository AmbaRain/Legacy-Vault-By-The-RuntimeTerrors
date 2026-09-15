import { AssetInfo, AssetSymbol } from '../types';

export const ASSETS_CONFIG: Record<AssetSymbol, AssetInfo> = {
  ETH: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 6,
    referenceUsd: 3805,
    tint: 'bg-primary/10 text-primary',
  },
  STRK: {
    symbol: 'STRK',
    name: 'Starknet Token',
    decimals: 4,
    referenceUsd: 1.49,
    tint: 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 2,
    referenceUsd: 1,
    tint: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
};

export const SUPPORTED_ASSETS = Object.values(ASSETS_CONFIG);

export const NETWORK_FEE = 0.0021;
export const BRIDGE_FEE_RATE = 0.001;

export function getAssetConfig(symbol: AssetSymbol | string): AssetInfo {
  return ASSETS_CONFIG[symbol as AssetSymbol] ?? ASSETS_CONFIG.ETH;
}

export function assetToUsd(symbol: AssetSymbol | string, amount: number): number {
  return amount * getAssetConfig(symbol).referenceUsd;
}

export function formatAssetAmount(symbol: AssetSymbol | string, amount: number): string {
  const { decimals } = getAssetConfig(symbol);
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: Math.min(2, decimals),
    maximumFractionDigits: decimals,
  });
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isValidStarknetAddress(address: string): boolean {
  const trimmed = address.trim();
  if (!trimmed.startsWith('0x') || trimmed.length < 10 || trimmed.length > 66) {
    return false;
  }
  return /^0x[0-9a-fA-F]+$/.test(trimmed);
}

export function formatShortAddress(address?: string, prefix = 6, suffix = 4): string {
  if (!address) return '—';
  if (address.length <= prefix + suffix + 2) return address;
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateOnly(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '—';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDateOnly(dateString);
}

export function daysSince(dateString: string, now = Date.now()): number {
  return Math.floor((now - new Date(dateString).getTime()) / 86400000);
}
