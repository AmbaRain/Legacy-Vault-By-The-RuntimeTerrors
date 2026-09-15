import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Shuffle,
  Search,
  ArrowLeftRight,
  Plus,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatAssetAmount, formatDateTime } from '../utils/format';

const FILTER_TABS = ['all', 'send', 'receive', 'deposit', 'withdraw', 'bridge', 'legacy'] as const;

export const TransactionsPage: React.FC = () => {
  const { vault } = useVault();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const transactions = vault?.transactions ?? [];

  const filtered = transactions.filter((tx) => {
    if (activeFilter !== 'all' && tx.kind !== activeFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      tx.kind.toLowerCase().includes(q) ||
      tx.asset.toLowerCase().includes(q) ||
      (tx.to_address?.toLowerCase().includes(q) ?? false) ||
      (tx.from_address?.toLowerCase().includes(q) ?? false) ||
      (tx.tx_hash?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete audit trail of all vault operations and automated transfers
          </p>
        </div>

        <Button asChild size="sm">
          <Link to="/send">
            <Plus className="mr-1.5 h-4 w-4" />
            New transaction
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search asset, address, tx hash..."
            className="w-full rounded-xl border border-input bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                activeFilter === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <Card className="border-border">
        <CardContent className="p-4 sm:p-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No transactions found"
              description={
                transactions.length === 0
                  ? 'Your transaction history will show up here once you make your first transfer or deposit.'
                  : 'No transactions match your current search or filter criteria.'
              }
              action={
                transactions.length === 0 ? (
                  <Button asChild size="sm">
                    <Link to="/deposit">Simulate a Deposit</Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )
              }
            />
          ) : (
            <div className="divide-y divide-border/60">
              {filtered.map((tx) => {
                const isIncoming = tx.kind === 'deposit' || tx.kind === 'receive';
                return (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 transition-colors hover:bg-muted/30 px-3 rounded-xl"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isIncoming
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : tx.kind === 'bridge'
                            ? 'bg-purple-500/10 text-purple-600'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {isIncoming ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : tx.kind === 'bridge' ? (
                          <Shuffle className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display font-semibold capitalize text-foreground text-sm">
                            {tx.kind} {tx.asset}
                          </p>
                          <StatusBadge status={tx.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(tx.created_at)} • {tx.network}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
                      <div className="text-right">
                        <p
                          className={`font-bold text-sm ${
                            isIncoming
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-foreground'
                          }`}
                        >
                          {isIncoming ? '+' : '-'}
                          {formatAssetAmount(tx.asset, tx.amount)} {tx.asset}
                        </p>
                        {tx.fee > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Fee: {tx.fee} {tx.fee_asset ?? 'STRK'}
                          </p>
                        )}
                      </div>
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
