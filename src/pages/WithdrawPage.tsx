import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, AlertTriangle, Wallet, CheckCircle2 } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { AssetSymbol } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import {
  formatAssetAmount,
  isValidStarknetAddress,
  NETWORK_FEE,
  SUPPORTED_ASSETS,
} from '../utils/format';

export const WithdrawPage: React.FC = () => {
  const { vault, withdraw } = useVault();

  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('STRK');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const walletAddress = vault?.profile?.wallet_address;

  if (!walletAddress) {
    return (
      <div className="pb-24 md:pb-8">
        <EmptyState
          icon={Wallet}
          title="Wallet not ready"
          description="Finish wallet setup before withdrawing."
          action={
            <Button asChild>
              <Link to="/onboarding/create">Set up wallet</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const currentBal = vault?.balances.find((b) => b.asset === selectedAsset)?.amount ?? 0;
  const parsedAmount = parseFloat(amount) || 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!isValidStarknetAddress(recipient)) {
      setError('Please enter a valid Starknet recipient address (0x...).');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }

    if (selectedAsset === 'STRK' && parsedAmount + NETWORK_FEE > currentBal) {
      setError('Insufficient STRK for withdrawal amount plus network fee.');
      return;
    }

    if (selectedAsset !== 'STRK' && parsedAmount > currentBal) {
      setError(`Insufficient ${selectedAsset} balance.`);
      return;
    }

    setPending(true);
    try {
      await withdraw({
        asset: selectedAsset,
        toAddress: recipient.trim(),
        amount: parsedAmount,
      });
      setSuccess(true);
      setAmount('');
      setRecipient('');
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Withdraw
      </h1>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Withdraw to External Address</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Asset</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value as AssetSymbol)}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SUPPORTED_ASSETS.map((asset) => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} — {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Destination address
              </label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x04bf6578a1670929a4a7537b83d16ca1f2113222e43bc09e9929288f3be1890b"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Amount</label>
                <button
                  type="button"
                  onClick={() => {
                    const max =
                      selectedAsset === 'STRK'
                        ? Math.max(0, currentBal - NETWORK_FEE)
                        : currentBal;
                    setAmount(max.toString());
                  }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Use Max
                </button>
              </div>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Available: {formatAssetAmount(selectedAsset, currentBal)} {selectedAsset}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network fee</span>
                <span className="font-semibold text-foreground">{NETWORK_FEE} STRK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final amount</span>
                <span className="font-semibold text-foreground">
                  {formatAssetAmount(selectedAsset, parsedAmount)} {selectedAsset}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p>Double-check this address. Blockchain transfers may be irreversible.</p>
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Withdrawal submitted and confirmed!
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={pending || !amount || !recipient}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {pending ? 'Withdrawing...' : 'Review and withdraw'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
