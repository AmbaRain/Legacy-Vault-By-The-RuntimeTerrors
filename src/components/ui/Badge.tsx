import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-primary/15 text-primary rounded-full',
  completed: 'bg-primary/15 text-primary rounded-full',
  active: 'bg-primary/15 text-primary rounded-full',
  pending: 'bg-warning/15 text-warning rounded-full',
  submitted: 'bg-warning/15 text-warning rounded-full',
  wallet_confirmation: 'bg-warning/15 text-warning rounded-full',
  initiating: 'bg-muted text-muted-foreground rounded-full',
  failed: 'bg-destructive/15 text-destructive rounded-full',
  warning: 'bg-warning/15 text-warning rounded-full',
  eligible: 'bg-primary/15 text-primary rounded-full',
  executed: 'bg-primary/15 text-primary rounded-full',
  not_configured: 'bg-muted text-muted-foreground rounded-full',
  paused: 'bg-muted text-muted-foreground rounded-full',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  active: 'Active',
  pending: 'Pending',
  submitted: 'Submitted',
  wallet_confirmation: 'Confirming',
  not_configured: 'Not configured',
};

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase();
  const styleClass = STATUS_STYLES[normalized] ?? 'bg-muted text-muted-foreground rounded-full';
  const label = STATUS_LABELS[normalized] ?? normalized.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors ${styleClass} ${className}`}
    >
      {label}
    </span>
  );
};