import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Check, Copy, AlertTriangle, Wallet } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SUPPORTED_ASSETS } from '../utils/format';

export const ReceivePage: React.FC = () => {
  const { vault } = useVault();
  const [copied, setCopied] = useState(false);

  const walletAddress = vault?.profile?.wallet_address;

  if (!walletAddress) {
    return (
      <div className="pb-24 md:pb-8">
        <EmptyState
          icon={Wallet}
          title="Wallet not ready"
          description="Finish wallet setup before receiving."
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

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Receive
      </h1>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Your Wallet Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* QR visual placeholder */}
          <div className="mx-auto flex h-48 w-48 flex-col items-center justify-center rounded-2xl border border-border/80 bg-muted/20 p-4 shadow-inner">
            <QrCode className="h-24 w-24 text-foreground/80" />
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">Scan to Pay</p>
          </div>

          {/* Full address display */}
          <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-center">
            <p className="break-all font-mono text-xs text-foreground select-all">
              {walletAddress}
            </p>
          </div>

          <Button
            onClick={handleCopy}
            className="w-full"
            variant="outline"
            size="lg"
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy address'}
          </Button>

          {/* Security warning */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              Only share this public Starknet address. Never reveal your recovery phrase or private
              keys to anyone.
            </p>
          </div>

          {/* Supported Tokens */}
          <div>
            <p className="text-xs font-semibold text-foreground">Supported Assets</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUPPORTED_ASSETS.map((asset) => (
                <span
                  key={asset.symbol}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {asset.symbol} ({asset.name})
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
