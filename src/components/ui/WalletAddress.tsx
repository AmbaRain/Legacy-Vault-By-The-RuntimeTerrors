import React, { useState } from 'react';

export interface WalletAddressProps {
  value?: string;
  variant?: 'short' | 'full';
  className?: string;
}

export const WalletAddress: React.FC<WalletAddressProps> = ({
  value,
  variant = 'short',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className={`flex items-center gap-2 rounded-md border border-border/50 bg-muted/50 p-3 ${className}`}>
      <span className="font-mono text-sm text-foreground break-all">
        {variant === 'short'
          ? `${value?.slice(0, 6)}...${value.slice(-4)}`
          : value}
      </span>
      <button
        onClick={handleCopy}
        className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
        aria-label="Copy address"
      >
        {copied ? (
          <span className="h-3.5 w-3.5" />
        ) : (
          <span />
        )}
      </button>
    </div>
  );
};