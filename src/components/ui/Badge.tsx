import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  submitted: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  wallet_confirmation: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  initiating: 'bg-muted text-muted-foreground',
  failed: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  eligible: 'bg-primary/15 text-primary',
  executed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  not_configured: 'bg-muted text-muted-foreground',
  paused: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  wallet_confirmation: 'Confirming',
  not_configured: 'Not configured',
};

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase();
  const styleClass = STATUS_STYLES[normalized] ?? 'bg-muted text-muted-foreground';
  const label = STATUS_LABELS[normalized] ?? normalized.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors ${styleClass} ${className}`}
    >
      {label}
    </span>
  );
};
