import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AddressDisplay } from '../../components/ui/AddressDisplay';
import { formatUsd } from '../../utils/format';
import { LegacyVaultLogo } from '../../components/ui/LegacyVaultLogo';

export const OnboardingReadyPage: React.FC = () => {
  const { user, vault, totalBalanceUsd } = useVault();

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (!vault?.profile?.wallet_address) {
    return <Navigate to="/onboarding/create" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <LegacyVaultLogo variant="horizontal" size="md" />
        </div>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E2329] border border-[#2A3038] text-[#AAFF00] shadow-sm">
          <CheckCircle2 className="h-8 w-8 text-[#AAFF00]" />
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-foreground">
          Your vault is ready
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account abstraction vault has been deployed on Starknet.
        </p>

        <Card className="mt-8 text-left border-border shadow-xs">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs text-muted-foreground">Network</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Starknet Mainnet
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs text-muted-foreground">Vault Address</span>
              <AddressDisplay value={vault.profile.wallet_address} variant="short" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Initial Balance</span>
              <span className="text-sm font-bold text-foreground">
                {formatUsd(totalBalanceUsd)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button asChild className="mt-8 w-full" size="lg">
          <Link to="/dashboard">
            Enter Legacy Vault
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
