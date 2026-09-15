import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const OnboardingSecurePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, vault, confirmRecovery } = useVault();
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  if (!vault?.profile?.wallet_address) {
    return <Navigate to="/onboarding/create" replace />;
  }

  if (vault?.profile?.onboarding_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleContinue = async () => {
    if (!acknowledged) return;
    setLoading(true);
    try {
      await confirmRecovery();
      navigate('/onboarding/ready');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Legacy Vault</span>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Secure your wallet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acknowledge key safety and recovery rules before entering your vault.
        </p>

        <Card className="mt-6 border-border">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-sm">Recovery is critical</p>
                <p className="mt-1">
                  In a production wallet, this step integrates threshold signatures and encrypted seed backups.
                  You acknowledge that self-custodial recovery information is your sole responsibility.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-foreground leading-relaxed">
                I understand that losing access to my recovery credentials may mean losing access to my assets permanently.
              </span>
            </label>

            <Button
              onClick={handleContinue}
              className="mt-4 w-full"
              size="lg"
              disabled={!acknowledged || loading}
            >
              {loading ? 'Finalizing...' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
