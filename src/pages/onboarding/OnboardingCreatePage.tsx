import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { isValidStarknetAddress } from '../../utils/format';
import { LegacyVaultLogo } from '../../components/ui/LegacyVaultLogo';

export const OnboardingCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, vault, createWallet, connectWallet } = useVault();

  const [mode, setMode] = useState<'create' | 'connect'>(
    searchParams.get('mode') === 'connect' ? 'connect' : 'create'
  );
  const [addressInput, setAddressInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="h-32 w-full animate-pulse rounded bg-muted" />
          <div className="h-32 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (vault?.profile?.onboarding_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  const walletAddress = vault?.profile?.wallet_address;

  const handleGenerate = async () => {
    setError('');
    setPending(true);
    try {
      await createWallet();
    } catch (err: any) {
      setError(err.message || 'Could not create wallet.');
    } finally {
      setPending(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidStarknetAddress(addressInput)) {
      setError('Please enter a valid Starknet address (e.g. 0x04bf...).');
      return;
    }

    setPending(true);
    try {
      await connectWallet(addressInput.trim());
    } catch (err: any) {
      setError(err.message || 'Could not connect wallet.');
    } finally {
      setPending(false);
    }
  };

  const handleCopy = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <LegacyVaultLogo variant="horizontal" size="md" />
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Create your Legacy Vault
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This address is public and receives your assets.
        </p>

        {/* Action: Generate Mode */}
        {!walletAddress && mode === 'create' && (
          <div className="mt-6">
            <Button
              onClick={handleGenerate}
              className="w-full"
              size="lg"
              disabled={pending}
            >
              {pending ? 'Generating...' : 'Generate wallet address'}
            </Button>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <button
              type="button"
              onClick={() => setMode('connect')}
              className="mt-4 w-full text-center text-sm text-primary hover:underline cursor-pointer"
            >
              I already have a wallet
            </button>
          </div>
        )}

        {/* Action: Connect Mode */}
        {!walletAddress && mode === 'connect' && (
          <form onSubmit={handleConnect} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Existing Starknet address
              </label>
              <input
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="0x04bf6578a1670929a4a7537b83d16ca1f2113222e43bc09e9929288f3be1890b"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? 'Connecting...' : 'Connect wallet'}
            </Button>

            <button
              type="button"
              onClick={() => setMode('create')}
              className="w-full text-center text-sm text-primary hover:underline cursor-pointer"
            >
              Create a new wallet instead
            </button>
          </form>
        )}

        {/* Address Generated/Connected Display */}
        {walletAddress && (
          <Card className="mt-6 border-border shadow-xs">
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Wallet address
              </p>
              <div className="mt-2.5 break-all rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground select-all border border-border/50">
                {walletAddress}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleCopy}
              >
                {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy address'}
              </Button>

              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                Your private keys are never shown in the normal wallet UI.
              </p>

              <Button asChild className="mt-6 w-full" size="lg">
                <Link to="/onboarding/secure">
                  Secure your wallet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
