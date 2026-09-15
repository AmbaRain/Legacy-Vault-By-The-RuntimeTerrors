import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, Check, Copy, Wallet, CheckCircle2 } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { AssetSymbol } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SUPPORTED_ASSETS } from '../utils/format';

export const DepositPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { vault, deposit } = useVault();

  const defaultAsset = (searchParams.get('asset') as AssetSymbol) || 'STRK';
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>(defaultAsset);
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const walletAddress = vault?.profile?.wallet_address;

  if (!walletAddress) {
    return (
      <div className="pb-24 md:pb-8">
        <EmptyState
          icon={Wallet}
          title="Wallet not ready"
          description="Finish wallet setup before depositing."
          action={
            <Button asChild>
              <Link to="/onboarding/create">Set up wallet</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSimulateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid deposit amount greater than 0.');
      return;
    }

    setPending(true);
    try {
      await deposit({
        asset: selectedAsset,
        amount: parsed,
      });
      setSuccess(true);
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Deposit simulation failed.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Deposit
      </h1>

      {/* Your Deposit Address */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Your Deposit Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Transfer assets to this address from an external wallet or exchange on Starknet.
          </p>

          <div className="rounded-xl border border-border bg-muted/30 p-3.5">
            <p className="break-all font-mono text-xs text-foreground select-all">
              {walletAddress}
            </p>
          </div>

          <Button onClick={handleCopy} variant="outline" className="w-full" size="sm">
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy address'}
          </Button>
        </CardContent>
      </Card>

      {/* Simulate Deposit for testing */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Simulate Deposit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSimulateDeposit} className="space-y-4">
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
              <label className="block text-xs font-semibold text-foreground mb-1.5">Amount</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Deposit successfully recorded and vault balance updated.
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={pending || !amount}
            >
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              {pending ? 'Recording deposit...' : 'Record deposit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
