import React from 'react';
import { StatusBadge } from './Badge';

export interface TransactionStateProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export const TransactionState: React.FC<TransactionStateProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      {showIcon && <StatusBadge status={status} className="h-3 w-3" />}
      <span className="text-xs font-medium capitalize">{status}</span>
    </span>
  );
};