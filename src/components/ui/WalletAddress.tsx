import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

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
    <div className={`inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 ${className}`}>
      <span className="font-mono text-xs text-foreground break-all">
        {variant === 'short'
          ? `${value?.slice(0, 6)}...${value.slice(-4)}`
          : value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        aria-label="Copy address"
        title="Copy address"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
};