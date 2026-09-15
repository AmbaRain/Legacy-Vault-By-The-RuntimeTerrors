import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'vault';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 rounded-lg',
      outline:
        'border border-input bg-background hover:bg-muted hover:text-foreground text-foreground rounded-lg',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg',
      ghost: 'hover:bg-muted text-foreground rounded-lg',
      destructive:
        'bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 rounded-lg',
      vault: 'bg-vault-foreground text-vault hover:bg-vault-foreground/90 font-semibold rounded-lg',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-11 px-6 text-base',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
