import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Pause, Play, Edit3, Clock, AlertTriangle } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { AddressDisplay } from '../components/ui/AddressDisplay';
import { EmptyState } from '../components/ui/EmptyState';
import {
  daysSince,
  formatDateOnly,
  formatDateTime,
  formatAssetAmount,
} from '../utils/format';

export const LegacyProtectionPage: React.FC = () => {
  const { vault, legacyStatus, pauseLegacyProtection } = useVault();
  const legacy = vault?.legacy;

  if (!legacy) {
    return (
      <div className="space-y-6 pb-24 md:pb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Legacy Protection
        </h1>

        <EmptyState
          icon={Shield}
          title="Legacy protection not configured"
          description="Protect your assets beyond your lifetime or extended inactivity with non-custodial Starknet smart contracts."
          action={
            <Button asChild size="lg">
              <Link to="/legacy-protection/setup">Set Up Legacy Protection</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const lastActivity = legacy.last_qualifying_activity;
  const eligibilityDate =
    lastActivity && legacy.dormancy_days
      ? new Date(new Date(lastActivity).getTime() + legacy.dormancy_days * 86400000).toISOString()
      : null;
  const elapsedDays = lastActivity ? daysSince(lastActivity) : 0;
  const isPaused = legacy.status === 'paused';

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Legacy Protection
          </h1>
          <p className="text-sm text-muted-foreground">
            Automated programmable succession rules for your digital assets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/legacy-protection/setup">
              <Edit3 className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => pauseLegacyProtection()}
          >
            {isPaused ? (
              <>
                <Play className="mr-1.5 h-4 w-4 text-emerald-600" />
                Resume
              </>
            ) : (
              <>
                <Pause className="mr-1.5 h-4 w-4 text-muted-foreground" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Surface Status Banner */}
      <div className="vault-surface rounded-3xl p-6 sm:p-8 shadow-xl border border-vault/20">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-vault-foreground backdrop-blur-xs">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-xs text-vault-foreground/70 uppercase font-semibold tracking-wider">
              Inheritance Policy
            </p>
            <div className="mt-0.5">
              <StatusBadge status={legacyStatus} />
            </div>
          </div>
        </div>

        <p className="mt-4 font-display text-lg font-semibold text-vault-foreground">
          {legacyStatus === 'active' && 'Your digital legacy is protected and monitored.'}
          {legacyStatus === 'warning' && 'Your protection timer is approaching the dormancy threshold.'}
          {legacyStatus === 'eligible' &&
            'Your vault is eligible to execute the configured inheritance transaction.'}
          {legacyStatus === 'executed' && 'The inheritance transaction has been executed.'}
          {legacyStatus === 'paused' && 'Legacy protection is temporarily paused.'}
        </p>

        <p className="mt-1 text-xs text-vault-foreground/70 max-w-xl">
          Qualifying on-chain activity (sending, depositing, bridging, or manually verifying your
          heartbeat) resets the timer automatically.
        </p>
      </div>

      {/* Detail Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Next of Kin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddressDisplay value={legacy.next_of_kin} variant="full" />
            <p className="mt-2 text-xs text-muted-foreground">
              Designated Starknet beneficiary address.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Dormancy Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold text-foreground">
              {legacy.dormancy_days} days
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum allowable inactivity before inheritance eligibility.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Last Qualifying Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-lg font-bold text-foreground">
              {formatDateTime(lastActivity)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {elapsedDays} days since last qualifying on-chain action.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Inheritance Eligibility Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-lg font-bold text-foreground">
              {formatDateOnly(eligibilityDate ?? undefined)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Triggered if zero qualifying activity occurs before this date.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Gas Reserve
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-foreground">
                {formatAssetAmount(legacy.gas_reserve_asset, legacy.gas_reserve)}{' '}
                {legacy.gas_reserve_asset}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Autonomous gas fund to execute the settlement transaction on Starknet.
              </p>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link to="/activity">
                <Clock className="mr-1.5 h-4 w-4" />
                View Activity Log
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};