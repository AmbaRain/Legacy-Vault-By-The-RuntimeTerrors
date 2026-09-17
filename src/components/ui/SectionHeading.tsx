import React from 'react';

export interface SectionHeadingProps {
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
  variant?: 'default' | 'subtle' | 'destructive';
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  className = '',
  as = 'h3',
  variant = 'default',
  children,
  ...props
}) => {
  const base = 'font-display font-semibold tracking-tight';
  const colors = {
    default: 'text-foreground',
    subtle: 'text-muted-foreground',
    destructive: 'text-destructive',
  };

  const sizes = {
    h2: 'text-2xl sm:text-3xl',
    h3: 'text-lg sm:text-xl',
    h4: 'text-base sm:text-lg',
  };

  const Tag = as;
  return (
    <Tag className={`${base} ${colors[variant]} ${sizes[Tag]} ${className}`} {...props}>
      {children}
    </Tag>
  );
};