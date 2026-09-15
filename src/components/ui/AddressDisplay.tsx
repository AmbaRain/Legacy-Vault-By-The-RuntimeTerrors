import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { formatShortAddress } from '../../utils/format';
import { Button } from './Button';

interface AddressDisplayProps {
  value?: string;
  variant?: 'short' | 'full';
  className?: string;
}

export const AddressDisplay: React.FC<AddressDisplayProps> = ({
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
    <div className={`inline-flex items-center gap-2 font-mono text-sm ${className}`}>
      <span className="text-foreground break-all">
        {variant === 'short' ? formatShortAddress(value) : value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={handleCopy}
        aria-label="Copy address"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};
