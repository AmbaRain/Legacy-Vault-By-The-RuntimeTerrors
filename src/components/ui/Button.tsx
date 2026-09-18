import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'vault';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, disabled, loading, asChild = false, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer no-underline select-none';

    const loadingIcon = loading ? (
      <span className="animate-spin h-4 w-4 mr-2 shrink-0 border-2 border-current border-t-transparent rounded-full" />
    ) : null;

    const variants = {
      default:
        'bg-primary !text-primary-foreground border border-primary/60 shadow hover:bg-primary/90 [&:active]:opacity-90 rounded-xl font-semibold transition-colors',
      outline:
        'border border-border bg-card/60 !text-foreground hover:bg-muted hover:!text-foreground hover:border-border/80 rounded-xl font-medium transition-colors [&:active]:opacity-90',
      secondary:
        'bg-secondary !text-secondary-foreground border border-border hover:bg-muted rounded-xl font-medium transition-colors [&:active]:opacity-90',
      ghost:
        'bg-transparent hover:bg-muted !text-foreground rounded-xl font-medium transition-colors [&:active]:opacity-90',
      destructive:
        'bg-destructive !text-destructive-foreground shadow hover:bg-destructive/90 rounded-xl font-semibold transition-colors [&:active]:opacity-90',
      vault:
        'bg-card !text-foreground border border-border hover:bg-muted/50 font-semibold rounded-xl transition-colors',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-9 w-9 p-0',
    };

    const combinedClasses = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
      return React.cloneElement(child, {
        ref: ref as any,
        className: `${combinedClasses} ${child.props.className || ''}`.trim(),
        ...props,
        children: loading ? (
          <span className="flex items-center justify-center">
            {loadingIcon}
            {child.props.children}
          </span>
        ) : (
          child.props.children
        ),
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={combinedClasses}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            {loadingIcon}
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';