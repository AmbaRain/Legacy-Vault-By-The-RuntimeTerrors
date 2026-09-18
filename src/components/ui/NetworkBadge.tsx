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
  const sizeClass = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  const networkColors: Record<string, string> = {
    'Starknet Mainnet': 'bg-primary/20 text-primary border border-primary',
    'Starknet Sepolia': 'bg-amber-200/20 text-amber-600 border border-amber-500/40',
    'Ethereum': 'bg-indigo-50/20 text-indigo-600 border border-indigo-500/40',
  };

  const colorClass = networkColors[network] ?? 'bg-muted text-muted-foreground border border-border/50';

  return (
    <span className={`{sizeClass} {textClass} rounded-md flex items-center justify-center ${colorClass} ${className}`}>
      {network}
    </span>
  );
};
