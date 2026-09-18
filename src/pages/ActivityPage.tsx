import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Shield, CheckCircle2, HeartPulse, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVault } from '../context/VaultContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { daysSince, formatDateTime } from '../utils/format';

export const ActivityPage: React.FC = () => {
  const { vault, legacyStatus, recordHeartbeat } = useVault();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const legacy = vault?.legacy;

  if (!legacy) {
    return (
      <div className="space-y-6 pb-24 md:pb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Activity & Heartbeat
        </h1>

        <EmptyState
          icon={Shield}
          title="Legacy protection not configured"
          description="Configure inheritance protection first to start tracking your on-chain heartbeats."
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
  const elapsed = lastActivity ? daysSince(lastActivity) : 0;
  const remainingDays = Math.max(0, legacy.dormancy_days - elapsed);
  const hasReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleHeartbeat = async () => {
    setPending(true);
    setSuccess(false);
    try {
      await recordHeartbeat();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Activity & Heartbeat
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor and reset the dormancy timer protecting your legacy vault
          </p>
        </div>

        <StatusBadge status={legacyStatus} />
      </div>

      {/* Heartbeat Status Banner */}
      <div className="vault-surface rounded-3xl p-6 sm:p-8 shadow-xl border border-vault/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Active Heartbeat
            </span>
            <h2 className="font-display text-3xl font-extrabold text-vault-foreground">
              {remainingDays} Days Remaining
            </h2>
            <p className="text-xs sm:text-sm text-vault-foreground/80 max-w-lg leading-relaxed">
              Last confirmed qualifying action was on {formatDateTime(lastActivity)} ({elapsed} days ago).
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: hasReducedMotion ? 1 : 0.97 }}
          >
            <Button
              onClick={handleHeartbeat}
              disabled={pending}
              className="vault-button-solid self-start md:self-auto shrink-0"
              size="lg"
            >
              <HeartPulse className="h-5 w-5 text-red-400" />
              {pending ? 'Recording Heartbeat...' : 'Send Heartbeat Ping'}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Success feedback */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 p-3 text-xs font-medium text-emerald-200 overflow-hidden"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          Heartbeat successfully broadcast to Starknet. Dormancy counter has been reset!
        </motion.div>
      )}

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              What Qualifies as Activity?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="font-bold text-foreground">1.</span>
              <span>Sending any token (ETH, STRK, USDC) from your vault</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-foreground">2.</span>
              <span>Depositing tokens or executing a bridge operation</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-foreground">3.</span>
              <span>Updating legacy protection configuration or beneficiary</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-foreground">4.</span>
              <span>Clicking the "Send Heartbeat Ping" button above</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              What Does Not Qualify?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="font-bold text-foreground">•</span>
              <span>Viewing your balances or browsing this interface</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-foreground">•</span>
              <span>Receiving incoming funds from external third parties</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-foreground">•</span>
              <span>Off-chain web logins without submitting a signed transaction</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};