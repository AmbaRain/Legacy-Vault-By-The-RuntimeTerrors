import React from 'react';

export interface PanelProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'outlined';
}

export const Panel: React.FC<PanelProps> = ({ className = '', children, variant = 'default', ...props }) => {
  const base = 'rounded-lg border p-6 transition-colors hover:shadow-sm';
  const variants = {
    default: 'bg-card border-border text-card-foreground',
    ghost: 'bg-card/50 border-0 shadow-sm',
    outlined: 'bg-card border border-border/50 text-card-foreground',
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};