import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Shuffle,
  ExternalLink,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { AddressDisplay } from '../components/ui/AddressDisplay';
import { formatAssetAmount, formatDateTime } from '../utils/format';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { vault } = useVault();

  const transaction = vault?.transactions.find((t) => t.id === id);

  if (!transaction) {
    return <Navigate to="/transactions" replace />;
  }

  const isIncoming = transaction.kind === 'deposit' || transaction.kind === 'receive';

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-8">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Link>
        </Button>
      </div>

      {/* Top Banner Card */}
      <div className="vault-surface rounded-2xl p-6 text-center shadow-lg border border-vault/20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-vault-foreground backdrop-blur-xs">
          {isIncoming ? (
            <ArrowDownLeft className="h-7 w-7 text-emerald-400" />
          ) : transaction.kind === 'bridge' ? (
            <Shuffle className="h-7 w-7 text-purple-400" />
          ) : (
            <ArrowUpRight className="h-7 w-7 text-vault-foreground" />
          )}
        </div>

        <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-vault-foreground">
          {isIncoming ? '+' : '-'}
          {formatAssetAmount(transaction.asset, transaction.amount)} {transaction.asset}
        </p>

        <div className="mt-3 flex justify-center">
          <StatusBadge status={transaction.status} />
        </div>
      </div>

      {/* Details Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5 text-sm divide-y divide-border/60">
          <div className="flex justify-between pt-1">
            <span className="text-muted-foreground">Type</span>
            <span className="font-semibold capitalize text-foreground">{transaction.kind}</span>
          </div>

          <div className="flex justify-between pt-3">
            <span className="text-muted-foreground">Asset</span>
            <span className="font-semibold text-foreground">{transaction.asset}</span>
          </div>

          <div className="flex justify-between pt-3">
            <span className="text-muted-foreground">Network</span>
            <span className="text-foreground font-medium">{transaction.network}</span>
          </div>

          {transaction.from_address && (
            <div className="flex items-center justify-between pt-3">
              <span className="text-muted-foreground">From</span>
              <AddressDisplay value={transaction.from_address} variant="short" />
            </div>
          )}

          {transaction.to_address && (
            <div className="flex items-center justify-between pt-3">
              <span className="text-muted-foreground">To</span>
              <AddressDisplay value={transaction.to_address} variant="short" />
            </div>
          )}

          <div className="flex justify-between pt-3">
            <span className="text-muted-foreground">Network Fee</span>
            <span className="text-foreground font-medium">
              {transaction.fee} {transaction.fee_asset ?? 'STRK'}
            </span>
          </div>

          <div className="flex justify-between pt-3">
            <span className="text-muted-foreground">Timestamp</span>
            <span className="text-foreground">{formatDateTime(transaction.created_at)}</span>
          </div>

          {transaction.tx_hash && (
            <div className="flex items-center justify-between pt-3">
              <span className="text-muted-foreground">Transaction Hash</span>
              <AddressDisplay value={transaction.tx_hash} variant="short" />
            </div>
          )}

          {transaction.failure_reason && (
            <div className="pt-3">
              <span className="text-xs text-destructive font-medium">
                {transaction.failure_reason}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explorer Link */}
      {transaction.tx_hash && (
        <Button asChild variant="outline" className="w-full">
          <a
            href={`https://starkscan.co/tx/${transaction.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Starknet Explorer
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
};
