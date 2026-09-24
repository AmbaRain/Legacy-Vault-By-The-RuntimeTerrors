import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ActivityItem,
  AssetSymbol,
  Balance,
  LegacyProtection,
  LegacyStatus,
  Transaction,
  UserProfile,
  VaultData,
} from '../types';
import { assetToUsd, daysSince, NETWORK_FEE, SUPPORTED_ASSETS } from '../utils/format';

interface VaultContextType {
  user: { id: string; email: string } | null;
  loading: boolean;
  vault: VaultData | null;
  totalBalanceUsd: number;
  legacyStatus: LegacyStatus;
  signUp: (email: string, pass: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  createWallet: () => Promise<string>;
  connectWallet: (address: string) => Promise<string>;
  confirmRecovery: () => Promise<void>;
  deposit: (data: { asset: AssetSymbol; amount: number }) => Promise<void>;
  send: (data: { asset: AssetSymbol; toAddress: string; amount: number }) => Promise<void>;
  withdraw: (data: { asset: AssetSymbol; toAddress: string; amount: number }) => Promise<void>;
  bridge: (data: {
    asset: AssetSymbol;
    amount: number;
    fromNetwork: string;
    toNetwork: string;
  }) => Promise<void>;
  setupLegacyProtection: (data: {
    nextOfKin: string;
    dormancyDays: number;
    gasReserve: number;
  }) => Promise<void>;
  pauseLegacyProtection: () => Promise<void>;
  confirmActivity: () => Promise<void>;
  recordHeartbeat: () => Promise<void>;
  updateGasReserve: (amount: number) => Promise<void>;
  resetVaultData: () => void;
}

const STORAGE_KEY_USER = 'lv_user_session';
const STORAGE_KEY_VAULT_PREFIX = 'lv_vault_';

const DEFAULT_BALANCES: Balance[] = [
  { asset: 'ETH', amount: 1.45 },
  { asset: 'STRK', amount: 320.0 },
  { asset: 'USDC', amount: 1250.0 },
];

function generateTxHash(): string {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${hex}`;
}

function generateStarknetAddress(): string {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x0${hex.slice(1)}`;
}

const VaultContext = createContext<VaultContextType | null>(null);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [vault, setVault] = useState<VaultData | null>(null);

  // Load vault data when user changes
  useEffect(() => {
    if (!user) {
      setVault(null);
      return;
    }
    try {
      const key = `${STORAGE_KEY_VAULT_PREFIX}${user.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setVault(JSON.parse(saved));
      } else {
        // Initial empty vault state for brand new user
        const initialVault: VaultData = {
          profile: {
            id: user.id,
            email: user.email,
            wallet_address: undefined,
            network: 'Starknet Mainnet',
            wallet_source: 'generated',
            onboarding_complete: false,
          },
          balances: [
            { asset: 'ETH', amount: 0 },
            { asset: 'STRK', amount: 0 },
            { asset: 'USDC', amount: 0 },
          ],
          transactions: [],
          legacy: null,
          activity: [],
        };
        localStorage.setItem(key, JSON.stringify(initialVault));
        setVault(initialVault);
      }
    } catch (e) {
      console.error('Failed to load vault data', e);
    }
  }, [user]);

  const saveVault = (updated: VaultData) => {
    setVault(updated);
    if (user) {
      localStorage.setItem(`${STORAGE_KEY_VAULT_PREFIX}${user.id}`, JSON.stringify(updated));
    }
  };

  const totalBalanceUsd =
    vault?.balances.reduce((acc, b) => acc + assetToUsd(b.asset, Number(b.amount)), 0) ?? 0;

  const calculateLegacyStatus = (legacy?: LegacyProtection | null): LegacyStatus => {
    if (!legacy || legacy.status === 'not_configured' || !legacy.dormancy_days || !legacy.last_qualifying_activity) {
      return legacy?.status === 'paused' ? 'paused' : 'not_configured';
    }
    if (legacy.status === 'paused') return 'paused';
    if (legacy.executed_at) return 'executed';

    const days = daysSince(legacy.last_qualifying_activity);
    const ratio = days / legacy.dormancy_days;
    if (ratio >= 1) return 'eligible';
    if (ratio >= 0.7) return 'warning';
    return 'active';
  };

  const legacyStatus = calculateLegacyStatus(vault?.legacy);

  const signUp = async (email: string, _pass: string) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const newUser = { id: `usr_${Date.now()}`, email: email.trim().toLowerCase() };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, _pass: string) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const existingUser = { id: `usr_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`, email: email.trim().toLowerCase() };
      setUser(existingUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(existingUser));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setVault(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const createWallet = async (): Promise<string> => {
    if (!vault || !user) throw new Error('User not logged in');
    await new Promise((r) => setTimeout(r, 600));
    const address = generateStarknetAddress();

    const updated: VaultData = {
      ...vault,
      profile: {
        ...vault.profile!,
        wallet_address: address,
        wallet_source: 'generated',
        network: 'Starknet Mainnet',
      },
      // Give initial starting balance for testing convenience
      balances: DEFAULT_BALANCES,
      activity: [
        {
          id: `act_${Date.now()}`,
          title: 'Wallet Created',
          category: 'wallet',
          qualifying: true,
          created_at: new Date().toISOString(),
        },
        ...vault.activity,
      ],
    };
    saveVault(updated);
    return address;
  };

  const connectWallet = async (address: string): Promise<string> => {
    if (!vault || !user) throw new Error('User not logged in');
    await new Promise((r) => setTimeout(r, 500));

    const updated: VaultData = {
      ...vault,
      profile: {
        ...vault.profile!,
        wallet_address: address,
        wallet_source: 'connected',
        network: 'Starknet Mainnet',
      },
      balances: DEFAULT_BALANCES,
      activity: [
        {
          id: `act_${Date.now()}`,
          title: 'Wallet Connected',
          category: 'wallet',
          qualifying: true,
          created_at: new Date().toISOString(),
        },
        ...vault.activity,
      ],
    };
    saveVault(updated);
    return address;
  };

  const confirmRecovery = async () => {
    if (!vault || !user) throw new Error('User not logged in');
    await new Promise((r) => setTimeout(r, 300));
    const updated: VaultData = {
      ...vault,
      profile: {
        ...vault.profile!,
        onboarding_complete: true,
      },
      activity: [
        {
          id: `act_${Date.now()}`,
          title: 'Recovery Acknowledged',
          category: 'security',
          qualifying: false,
          created_at: new Date().toISOString(),
        },
        ...vault.activity,
      ],
    };
    saveVault(updated);
  };

  const deposit = async ({ asset, amount }: { asset: AssetSymbol; amount: number }) => {
    if (!vault) throw new Error('Vault not initialized');
    await new Promise((r) => setTimeout(r, 500));

    const now = new Date().toISOString();
    const updatedBalances = vault.balances.map((b) =>
      b.asset === asset ? { ...b, amount: Number((b.amount + amount).toFixed(6)) } : b
    );

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      kind: 'deposit',
      asset,
      amount,
      fee: 0,
      fee_asset: 'STRK',
      status: 'completed',
      created_at: now,
      network: 'Starknet Mainnet',
      to_address: vault.profile?.wallet_address,
      tx_hash: generateTxHash(),
    };

    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      title: `Deposit ${amount} ${asset}`,
      category: 'transfer',
      qualifying: true,
      created_at: now,
    };

    saveVault({
      ...vault,
      balances: updatedBalances,
      transactions: [newTx, ...vault.transactions],
      activity: [newActivity, ...vault.activity],
      legacy: vault.legacy
        ? {
            ...vault.legacy,
            last_qualifying_activity: now,
          }
        : null,
    });
  };

  const send = async ({
    asset,
    toAddress,
    amount,
  }: {
    asset: AssetSymbol;
    toAddress: string;
    amount: number;
  }) => {
    if (!vault) throw new Error('Vault not initialized');
    await new Promise((r) => setTimeout(r, 600));

    const assetBal = vault.balances.find((b) => b.asset === asset)?.amount ?? 0;
    const strkBal = vault.balances.find((b) => b.asset === 'STRK')?.amount ?? 0;

    if (asset === 'STRK' && amount + NETWORK_FEE > assetBal) {
      throw new Error('Insufficient STRK balance for transfer and fee.');
    }
    if (asset !== 'STRK' && (amount > assetBal || NETWORK_FEE > strkBal)) {
      throw new Error('Insufficient balance or insufficient STRK for gas fee.');
    }

    const now = new Date().toISOString();
    const updatedBalances = vault.balances.map((b) => {
      if (b.asset === asset && asset === 'STRK') {
        return { ...b, amount: Number((b.amount - amount - NETWORK_FEE).toFixed(6)) };
      }
      if (b.asset === asset) {
        return { ...b, amount: Number((b.amount - amount).toFixed(6)) };
      }
      if (b.asset === 'STRK' && asset !== 'STRK') {
        return { ...b, amount: Number((b.amount - NETWORK_FEE).toFixed(6)) };
      }
      return b;
    });

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      kind: 'send',
      asset,
      amount,
      fee: NETWORK_FEE,
      fee_asset: 'STRK',
      status: 'completed',
      created_at: now,
      network: 'Starknet Mainnet',
      from_address: vault.profile?.wallet_address,
      to_address: toAddress,
      tx_hash: generateTxHash(),
    };

    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      title: `Send ${amount} ${asset}`,
      category: 'transfer',
      qualifying: true,
      created_at: now,
    };

    saveVault({
      ...vault,
      balances: updatedBalances,
      transactions: [newTx, ...vault.transactions],
      activity: [newActivity, ...vault.activity],
      legacy: vault.legacy
        ? {
            ...vault.legacy,
            last_qualifying_activity: now,
          }
        : null,
    });
  };

  const withdraw = async ({
    asset,
    toAddress,
    amount,
  }: {
    asset: AssetSymbol;
    toAddress: string;
    amount: number;
  }) => {
    if (!vault) throw new Error('Vault not initialized');
    await new Promise((r) => setTimeout(r, 600));

    const assetBal = vault.balances.find((b) => b.asset === asset)?.amount ?? 0;
    const strkBal = vault.balances.find((b) => b.asset === 'STRK')?.amount ?? 0;

    if (asset === 'STRK' && amount + NETWORK_FEE > assetBal) {
      throw new Error('Insufficient STRK balance for withdrawal and fee.');
    }
    if (asset !== 'STRK' && (amount > assetBal || NETWORK_FEE > strkBal)) {
      throw new Error('Insufficient balance or insufficient STRK for gas fee.');
    }

    const now = new Date().toISOString();
    const updatedBalances = vault.balances.map((b) => {
      if (b.asset === asset && asset === 'STRK') {
        return { ...b, amount: Number((b.amount - amount - NETWORK_FEE).toFixed(6)) };
      }
      if (b.asset === asset) {
        return { ...b, amount: Number((b.amount - amount).toFixed(6)) };
      }
      if (b.asset === 'STRK' && asset !== 'STRK') {
        return { ...b, amount: Number((b.amount - NETWORK_FEE).toFixed(6)) };
      }
      return b;
    });

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      kind: 'withdraw',
      asset,
      amount,
      fee: NETWORK_FEE,
      fee_asset: 'STRK',
      status: 'completed',
      created_at: now,
      network: 'Starknet Mainnet',
      from_address: vault.profile?.wallet_address,
      to_address: toAddress,
      tx_hash: generateTxHash(),
    };

    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      title: `Withdraw ${amount} ${asset}`,
      category: 'transfer',
      qualifying: true,
      created_at: now,
    };

    saveVault({
      ...vault,
      balances: updatedBalances,
      transactions: [newTx, ...vault.transactions],
      activity: [newActivity, ...vault.activity],
      legacy: vault.legacy
        ? {
            ...vault.legacy,
            last_qualifying_activity: now,
          }
        : null,
    });
  };

  const bridge = async ({
    asset,
    amount,
    fromNetwork,
    toNetwork,
  }: {
    asset: AssetSymbol;
    amount: number;
    fromNetwork: string;
    toNetwork: string;
  }) => {
    if (!vault) throw new Error('Vault not initialized');
    await new Promise((r) => setTimeout(r, 600));

    const bridgeFee = amount * 0.001;
    const now = new Date().toISOString();

    const updatedBalances = vault.balances.map((b) =>
      b.asset === asset ? { ...b, amount: Number((b.amount - amount - bridgeFee).toFixed(6)) } : b
    );

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      kind: 'bridge',
      asset,
      amount,
      fee: bridgeFee,
      fee_asset: asset,
      status: 'pending',
      created_at: now,
      network: `${fromNetwork} → ${toNetwork}`,
      from_address: vault.profile?.wallet_address,
      tx_hash: generateTxHash(),
    };

    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      title: `Bridge ${amount} ${asset} (${fromNetwork} → ${toNetwork})`,
      category: 'bridge',
      qualifying: true,
      created_at: now,
    };

    saveVault({
      ...vault,
      balances: updatedBalances,
      transactions: [newTx, ...vault.transactions],
      activity: [newActivity, ...vault.activity],
      legacy: vault.legacy
        ? {
            ...vault.legacy,
            last_qualifying_activity: now,
          }
        : null,
    });
  };

  const setupLegacyProtection = async ({
    nextOfKin,
    dormancyDays,
    gasReserve,
  }: {
    nextOfKin: string;
    dormancyDays: number;
    gasReserve: number;
  }) => {
    if (!vault) throw new Error('Vault not initialized');
    await new Promise((r) => setTimeout(r, 600));

    const now = new Date().toISOString();
    const legacy: LegacyProtection = {
      next_of_kin: nextOfKin,
      dormancy_days: dormancyDays,
      gas_reserve: gasReserve,
      gas_reserve_asset: 'STRK',
      status: 'active',
      last_qualifying_activity: now,
      executed_at: null,
    };

    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      title: 'Legacy Protection Activated',
      category: 'legacy',
      qualifying: true,
      created_at: now,
    };

    saveVault({
      ...vault,
      legacy,
      activity: [newActivity, ...vault.activity],
    });
  };

  const pauseLegacyProtection = async () => {
    if (!vault || !vault.legacy) return;
    await new Promise((r) => setTimeout(r, 300));
    const nextStatus: LegacyStatus = vault.legacy.status === 'paused' ? 'active' : 'paused';
    saveVault({
      ...vault,
      legacy: {
        ...vault.legacy,
        status: nextStatus,
      },
      activity: [
        {
          id: `act_${Date.now()}`,
          title: `Legacy Protection ${nextStatus === 'paused' ? 'Paused' : 'Resumed'}`,
          category: 'legacy',
          qualifying: false,
          created_at: new Date().toISOString(),
        },
        ...vault.activity,
      ],
    });
  };

  const confirmActivity = async () => {
    if (!vault) return;
    await new Promise((r) => setTimeout(r, 400));
    const now = new Date().toISOString();

    saveVault({
      ...vault,
      legacy: vault.legacy
        ? {
            ...vault.legacy,
            last_qualifying_activity: now,
            status: vault.legacy.status === 'paused' ? 'paused' : 'active',
          }
        : null,
      activity: [
        {
          id: `act_${Date.now()}`,
          title: 'Confirmed On-chain Activity',
          category: 'activity',
          qualifying: true,
          created_at: now,
        },
        ...vault.activity,
      ],
    });
  };

  const updateGasReserve = async (amount: number) => {
    if (!vault || !vault.legacy) return;
    saveVault({
      ...vault,
      legacy: {
        ...vault.legacy,
        gas_reserve: amount,
      },
    });
  };

  const resetVaultData = () => {
    if (!user) return;
    const initialVault: VaultData = {
      profile: {
        id: user.id,
        email: user.email,
        wallet_address: vault?.profile?.wallet_address || generateStarknetAddress(),
        network: 'Starknet Mainnet',
        wallet_source: 'generated',
        onboarding_complete: true,
      },
      balances: [
        { asset: 'ETH', amount: 1.45 },
        { asset: 'STRK', amount: 320.0 },
        { asset: 'USDC', amount: 1250.0 },
      ],
      transactions: [],
      legacy: null,
      activity: [],
    };
    saveVault(initialVault);
  };

  return (
    <VaultContext.Provider
      value={{
        user,
        loading,
        vault,
        totalBalanceUsd,
        legacyStatus,
        signUp,
        signIn,
        signOut,
        createWallet,
        connectWallet,
        confirmRecovery,
        deposit,
        send,
        withdraw,
        bridge,
        setupLegacyProtection,
        pauseLegacyProtection,
        confirmActivity,
        recordHeartbeat: confirmActivity,
        updateGasReserve,
        resetVaultData,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
};
