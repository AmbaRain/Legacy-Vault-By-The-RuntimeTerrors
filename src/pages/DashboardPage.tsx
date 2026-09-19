import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  Shuffle,
  Shield,
  Clock,
  ArrowRight,
  Coins,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useVault } from '../context/VaultContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { TokenIcon } from '../components/ui/TokenIcon';
import { StatusBadge } from '../components/ui/Badge';
import { AddressDisplay } from '../components/ui/AddressDisplay';
import { EmptyState } from '../components/ui/EmptyState';
import { LegacyVaultIcon } from '../components/ui/LegacyVaultLogo';
import {
  assetToUsd,
  formatAssetAmount,
  formatDateTime,
  formatUsd,
  getAssetConfig,
  daysSince,
} from '../utils/format';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-primary/15 text-primary',
  warning: 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
  eligible: 'bg-primary/15 text-primary',
  executed: 'bg-primary/15 text-primary',
  not_configured: 'bg-muted text-muted-foreground',
  paused: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  warning: 'Warning',
  eligible: 'Eligible',
  executed: 'Executed',
  not_configured: 'Not configured',
  paused: 'Paused',
};

export const DashboardPage: React.FC = () => {
  const { vault, totalBalanceUsd, legacyStatus } = useVault();

  const balances = vault?.balances ?? [];
  const transactions = vault?.transactions ?? [];
  const legacy = vault?.legacy;

  const getLegacyDetails = () => {
    if (!legacy || legacy.status === 'not_configured' || !legacy.dormancy_days) {
      return null;
    }
    const days = daysSince(legacy.last_qualifying_activity ?? legacy.last_qualifying_activity ?? '');
    const ratio = days / legacy.dormancy_days;
    let status: string;
    let secondsRemaining = 0;

    if (legacy.status === 'paused') {
      status = 'paused';
    } else if (legacy.executed_at) {
      status = 'executed';
    } else if (ratio >= 1) {
      status = 'eligible';
      secondsRemaining = 0;
    } else if (ratio >= 0.7) {
      status = 'warning';
      const daysRemaining = Math.ceil((1 - ratio) * legacy.dormancy_days);
      secondsRemaining = daysRemaining * 86400;
    } else {
      status = 'active';
      const daysRemaining = legacy.dormancy_days - days;
      secondsRemaining = daysRemaining > 0 ? daysRemaining * 86400 : 0;
    }

    return {
      status,
      secondsRemaining,
      days: legacy.dormancy_days,
      next_of_kin: legacy.next_of_kin,
      gas_reserve: legacy.gas_reserve,
      gas_reserve_asset: legacy.gas_reserve_asset,
      last_qualifying_activity: legacy.last_qualifying_activity,
    };
  };

  const details = getLegacyDetails();

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Vault Balance Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="vault-surface rounded-3xl p-6 sm:p-8 shadow-xl border border-vault/20 relative overflow-hidden bg-gradient-to-br from-[#1E2329] to-[#14181F]"
      >
        {/* Subtle background brand icon watermark */}
        <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-10 text-[#AAFF00]">
          <LegacyVaultIcon size={180} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-vault-foreground/90 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#AAFF00] animate-pulse" />
              Starknet Mainnet
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Balance
            </p>
            <div className="mt-1 flex items-baseline gap-3">
              <motion.h1
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground"
              >
                {formatUsd(totalBalanceUsd)}
              </motion.h1>
              <span className="inline-flex items-center rounded-md bg-[#AAFF00]/10 px-2 py-0.5 text-xs font-semibold text-[#AAFF00]">
                ↑ +4.21% (24h)
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>Vault:</span>
              <AddressDisplay
                value={vault?.profile?.wallet_address}
                variant="short"
                className="text-foreground font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0 pt-2 sm:pt-0">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button asChild className="vault-button-solid" size="md">
                <Link to="/deposit">
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Deposit
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button asChild variant="outline" className="vault-button-outline" size="md">
                <Link to="/send">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Send
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          {
            to: '/deposit',
            title: 'Deposit',
            desc: 'Receive funds',
            icon: ArrowDownLeft,
          },
          {
            to: '/send',
            title: 'Send',
            desc: 'Transfer tokens',
            icon: ArrowUpRight,
          },
          {
            to: '/receive',
            title: 'Receive',
            desc: 'Show QR / Address',
            icon: QrCode,
          },
          {
            to: '/bridge',
            title: 'Bridge',
            desc: 'Ethereum ↔ Starknet',
            icon: Shuffle,
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                to={item.to}
                className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 text-center transition-shadow hover:border-primary/40 hover:shadow-md group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-2.5 font-display text-sm font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets List */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Assets</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/assets" className="text-xs font-semibold text-primary">
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {balances.map((b) => {
              const info = getAssetConfig(b.asset);
              const usdVal = assetToUsd(b.asset, b.amount);
              return (
                <motion.div
                  key={b.asset}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={b.asset} />
                    <div>
                      <p className="font-display text-sm font-bold text-foreground">{b.asset}</p>
                      <p className="text-xs text-muted-foreground">{info.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-foreground">
                      {formatAssetAmount(b.asset, b.amount)} {b.asset}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatUsd(usdVal)}</p>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* Legacy Protection Summary */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CardTitle>Legacy Protection</CardTitle>
              {details ? (
                <StatusBadge status={details.status} className="ml-2" />
              ) : (
                <StatusBadge status={legacyStatus} />
              )}
            </div>
            {legacy && legacy.status !== 'not_configured' ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/legacy-protection" className="text-xs font-semibold text-primary">
                  Details
                </Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {legacy ? (
              <div className="space-y-4">
                {details ? (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Next of kin:</span>
                      <AddressDisplay value={details.next_of_kin} variant="short" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dormancy period:</span>
                      <span className="font-semibold text-foreground">
                        {details.days} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gas reserve:</span>
                      <span className="font-semibold text-foreground">
                        {formatAssetAmount(details.gas_reserve_asset, details.gas_reserve)} {details.gas_reserve_asset}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last heartbeat:</span>
                      <span className="font-medium text-foreground">
                        {formatDateTime(details.last_qualifying_activity)}
                      </span>
                    </div>
                    {details.status !== 'paused' && details.status !== 'executed' && (
                      <div>
                        <span className="text-muted-foreground">Time remaining:</span>
                        <span className="font-semibold text-foreground">
                          {details.secondsRemaining > 0
                            ? `${Math.ceil(details.secondsRemaining / 86400)} days`
                            : 'Active'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <StatusBadge status={legacyStatus} className="mx-auto mb-2" />
                    <p className="text-muted-foreground">Legacy protection status</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button asChild variant="outline" className="w-full text-xs" size="sm">
                    <Clock className="mr-2 h-3.5 w-3.5" />
                    Verify on-chain heartbeat timer
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Shield}
                title="Legacy protection not configured"
                description="Protect your assets beyond your lifetime or extended periods of inactivity."
                action={
                  <Button asChild size="sm">
                    <Link to="/legacy-protection/setup">
                      Set Up Legacy Protection
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Recent Transactions</CardTitle>
          {transactions.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/transactions" className="text-xs font-semibold text-primary">
                View all
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="No transactions yet"
              description="Make a deposit or transfer to see your activity history."
              action={
                <Button asChild size="sm">
                  <Link to="/deposit">Simulate a Deposit</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border/60">
              {transactions.slice(0, 5).map((tx) => {
                const isIncoming = tx.kind === 'deposit' || tx.kind === 'receive';
                const txStatus = tx.status ?? 'completed';
                return (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    className="flex items-center justify-between py-3.5 transition-colors hover:bg-muted/30 px-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          isIncoming
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : tx.kind === 'bridge'
                            ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
                            : 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary-200'
                        }`}
                      >
                        {isIncoming ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : tx.kind === 'bridge' ? (
                          <Shuffle className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-display text-sm font-semibold capitalize text-foreground">
                          {tx.kind} {tx.asset}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-semibold text-sm ${
                          isIncoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                        }`}
                      >
                        {isIncoming ? '+' : '-'}
                        {formatAssetAmount(tx.asset, tx.amount)} {tx.asset}
                      </p>
                      <StatusBadge status={txStatus} className="mt-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};