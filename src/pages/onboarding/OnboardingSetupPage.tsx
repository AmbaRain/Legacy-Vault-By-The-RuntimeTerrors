import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, KeyRound } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LegacyVaultLogo } from '../../components/ui/LegacyVaultLogo';

export const OnboardingSetupPage: React.FC = () => {
  const { user } = useVault();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <LegacyVaultLogo variant="horizontal" size="md" />
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Choose wallet setup
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          How would you like to access your vault?
        </p>

        <div className="mt-6 grid gap-4">
          <Card className="cursor-pointer transition-shadow hover:shadow-md border-border">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-semibold text-foreground">
                    Create New Wallet
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate a fresh Starknet account for your vault.
                  </p>
                  <Button asChild className="mt-4" size="sm">
                    <Link to="/onboarding/create?mode=create">Create wallet</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md border-border">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-semibold text-foreground">
                    Connect Existing Wallet
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Link a Starknet-compatible wallet you already own.
                  </p>
                  <Button asChild variant="outline" className="mt-4" size="sm">
                    <Link to="/onboarding/create?mode=connect">Connect wallet</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {user ? 'Signed in.' : 'No account yet? '}{' '}
          {!user && (
            <Link to="/auth?mode=signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          )}
        </p>
      </div>
    </div>
  );
};
