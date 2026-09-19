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
}) => {
  return <StatusBadge status={status} className={className} />;
};