import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, AlertTriangle, Wallet, CheckCircle2, ArrowRight } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { AssetSymbol } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import {
  BRIDGE_FEE_RATE,
  formatAssetAmount,
  NETWORK_FEE,
  SUPPORTED_ASSETS,
} from '../utils/format';

export const BridgePage: React.FC = () => {
  const { vault, bridge } = useVault();

  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('ETH');
  const [fromNetwork, setFromNetwork] = useState('Starknet');
  const [toNetwork, setToNetwork] = useState('Ethereum');
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
          description="Finish wallet setup before bridging."
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
  const bridgeFee = parsedAmount * BRIDGE_FEE_RATE;
  const minAmount = 0.005;

  const handleSwapNetworks = () => {
    setFromNetwork(toNetwork);
    setToNetwork(fromNetwork);
  };

  const handleBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (parsedAmount < minAmount) {
      setError(`Minimum bridge amount is ${minAmount} ${selectedAsset}.`);
      return;
    }

    if (fromNetwork === 'Starknet' && parsedAmount + bridgeFee > currentBal) {
      setError(`Insufficient ${selectedAsset} balance to bridge plus protocol fee.`);
      return;
    }

    setPending(true);
    try {
      await bridge({
        asset: selectedAsset,
        amount: parsedAmount,
        fromNetwork,
        toNetwork,
      });
      setSuccess(true);
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Bridge transaction failed.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Bridge
      </h1>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Cross-Chain Bridge</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBridge} className="space-y-4">
            {/* Asset Selector */}
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

            {/* Network direction row */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">From</label>
                <select
                  value={fromNetwork}
                  onChange={(e) => setFromNetwork(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Starknet">Starknet</option>
                  <option value="Ethereum">Ethereum</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSwapNetworks}
                className="mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-foreground hover:bg-muted cursor-pointer transition-colors"
                title="Swap directions"
              >
                <Shuffle className="h-4 w-4" />
              </button>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">To</label>
                <select
                  value={toNetwork}
                  onChange={(e) => setToNetwork(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Ethereum">Ethereum</option>
                  <option value="Starknet">Starknet</option>
                </select>
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">Amount</label>
                <button
                  type="button"
                  onClick={() => setAmount(Math.max(0, currentBal * 0.95).toString())}
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

            {/* Breakdown summary */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bridge Fee (0.1%)</span>
                <span className="font-semibold text-foreground">
                  {formatAssetAmount(selectedAsset, bridgeFee)} {selectedAsset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-semibold text-foreground">{NETWORK_FEE} STRK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum</span>
                <span className="font-semibold text-foreground">
                  {minAmount} {selectedAsset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Time</span>
                <span className="font-semibold text-foreground">~10 min</span>
              </div>
            </div>

            {/* Simulated note */}
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p>
                Bridge integration is simulated for this build. Real bridge execution will be wired
                to StarkGate L1/L2 messaging in production.
              </p>
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Bridge submitted and is now pending confirmation.
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={pending || !amount}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              {pending ? 'Bridging...' : 'Review and bridge'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
