import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, AlertTriangle, Check, Wallet, ArrowLeft } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatShortAddress, isValidStarknetAddress } from '../utils/format';

const DORMANCY_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '1 year', value: 365 },
];

export const LegacyProtectionSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { vault, setupLegacyProtection } = useVault();

  const legacy = vault?.legacy;
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [nextOfKin, setNextOfKin] = useState(legacy?.next_of_kin ?? '');
  const [dormancyDays, setDormancyDays] = useState<number>(legacy?.dormancy_days ?? 180);
  const [gasReserve, setGasReserve] = useState<number>(legacy?.gas_reserve ?? 0.05);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const walletAddress = vault?.profile?.wallet_address;

  if (!walletAddress) {
    return (
      <div className="pb-24 md:pb-8">
        <EmptyState
          icon={Wallet}
          title="Wallet not ready"
          description="Finish wallet setup before configuring legacy protection."
          action={
            <Button asChild>
              <Link to="/onboarding/create">Set up wallet</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const validateNextOfKin = () => {
    if (!isValidStarknetAddress(nextOfKin)) {
      setError('Enter a valid Starknet address (0x...).');
      return false;
    }
    if (nextOfKin.toLowerCase() === walletAddress.toLowerCase()) {
      setError('Next of kin address cannot be your own wallet address.');
      return false;
    }
    setError('');
    return true;
  };

  const handleActivate = async () => {
    setError('');
    setPending(true);
    try {
      await setupLegacyProtection({
        nextOfKin: nextOfKin.trim(),
        dormancyDays,
        gasReserve,
      });
      navigate('/legacy-protection');
    } catch (err: any) {
      setError(err.message || 'Could not activate legacy protection.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-8">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/legacy-protection">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Set Up Legacy Protection
      </h1>

      {/* Step Progress Indicators */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
        {[
          { num: 1, label: '1. Beneficiary' },
          { num: 2, label: '2. Dormancy' },
          { num: 3, label: '3. Gas' },
          { num: 4, label: '4. Confirm' },
        ].map((s) => (
          <div
            key={s.num}
            className={`rounded-lg py-2 border transition-colors ${
              step === s.num
                ? 'border-primary bg-primary text-primary-foreground'
                : step > s.num
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Step 1: Beneficiary */}
      {step === 1 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Add Next of Kin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the Starknet wallet address that should inherit and receive your vault assets if
              inactivity occurs.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Starknet Address
              </label>
              <input
                value={nextOfKin}
                onChange={(e) => setNextOfKin(e.target.value)}
                placeholder="0x04bf6578a1670929a4a7537b83d16ca1f2113222e43bc09e9929288f3be1890b"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (validateNextOfKin()) setStep(2);
              }}
            >
              Continue to Dormancy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Dormancy */}
      {step === 2 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Choose Dormancy Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              If no qualifying on-chain activity occurs for this duration, your vault becomes
              eligible to execute the inheritance transfer.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {DORMANCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDormancyDays(opt.value)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all cursor-pointer ${
                    dormancyDays === opt.value
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border bg-card text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span className="font-display text-base font-bold">{opt.label}</span>
                  <span className="mt-1 text-[11px] text-muted-foreground">
                    {opt.value === 365 ? '12 months' : `${Math.round(opt.value / 30)} months`}
                  </span>
                </button>
              ))}
            </div>

            <Button className="w-full" size="lg" onClick={() => setStep(3)}>
              Continue to Gas Reserve
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Back
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Gas Reserve */}
      {step === 3 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Gas Reserve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reserve a small amount of STRK to fund the autonomous future execution transaction on
              Starknet.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Reserve STRK
              </label>
              <input
                type="number"
                step="0.001"
                min="0.01"
                value={gasReserve}
                onChange={(e) => setGasReserve(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">Recommended: 0.05 STRK</p>
            </div>

            <Button className="w-full" size="lg" onClick={() => setStep(4)}>
              Review and Confirm
            </Button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Back
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm & Activate */}
      {step === 4 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Review Protection Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next of kin:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatShortAddress(nextOfKin, 8, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dormancy:</span>
                <span className="font-bold text-foreground">{dormancyDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas reserve:</span>
                <span className="font-bold text-foreground">{gasReserve} STRK</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p>
                Inheritance triggers only on qualifying on-chain inactivity. Regular website visits
                do not reset the heartbeat — making a transfer or confirming activity resets it.
              </p>
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <Button
              className="w-full"
              size="lg"
              disabled={pending}
              onClick={handleActivate}
            >
              <Check className="mr-2 h-4 w-4" />
              {pending ? 'Activating Policy...' : 'Activate Legacy Protection'}
            </Button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Back
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
