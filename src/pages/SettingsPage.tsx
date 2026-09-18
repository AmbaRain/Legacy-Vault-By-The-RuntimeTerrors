import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Check, Copy } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, vault, signOut, resetVaultData } = useVault();
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);

  const walletAddress = vault?.profile?.wallet_address;

  const handleCopy = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo balances, transactions, and legacy settings to default?')) {
      setResetting(true);
      resetVaultData();
      setTimeout(() => {
        setResetting(false);
      }, 500);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account credentials, Starknet network, and prototype data
        </p>
      </div>

      {/* Account Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-semibold text-sm text-foreground">{user?.email || 'N/A'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-muted-foreground">Network</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Starknet Mainnet
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block mb-1 text-xs">Address</span>
            <div className="break-all rounded-lg bg-muted/40 p-3 font-mono text-xs text-foreground select-all border border-border/60">
              {walletAddress || 'No wallet created yet'}
            </div>

            {walletAddress && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleCopy}
              >
                {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy address'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset Prototype Data */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Prototype Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Need to reset your demo balances, clear created transactions, and restore the initial sample
            wallet state? You can re-initialize the local prototype storage.
          </p>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetData}
            disabled={resetting}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : 'Reset Demo Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};