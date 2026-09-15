import React from 'react';

export const TokenIcon: React.FC<{ symbol: string; className?: string }> = ({
  symbol,
  className = '',
}) => {
  const initial = symbol.slice(0, 1);
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-display text-sm font-bold ${className}`}
      aria-label={symbol}
    >
      {initial}
    </div>
  );
};
