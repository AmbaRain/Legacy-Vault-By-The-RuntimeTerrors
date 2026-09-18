import React from 'react';

export interface NetworkBadgeProps {
  network: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const NetworkBadge: React.FC<NetworkBadgeProps> = ({
  network,
  className = '',
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const networkColors: Record<string, string> = {
    'Starknet Mainnet': 'bg-primary/15 text-primary border border-primary/40',
    'Starknet Sepolia': 'bg-amber-500/15 text-amber-400 border border-amber-500/40',
    'Ethereum': 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/40',
  };

  const colorClass = networkColors[network] ?? 'bg-muted text-muted-foreground border border-border/50';

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full ${sizeClass} ${colorClass} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0 mr-1.5" />
      {network}
    </span>
  );
};
