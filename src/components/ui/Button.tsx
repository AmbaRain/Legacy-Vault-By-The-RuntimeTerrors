import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'vault';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shrink-0 select-none [&_svg]:shrink-0 [&_svg.mr-2]:mr-0 [&_svg.ml-2]:ml-0 [&_svg.mr-1\\.5]:mr-0 [&_svg.ml-1\\.5]:ml-0';

    const variants = {
      default: 'bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 rounded-lg',
      outline:
        'border border-border bg-card/60 hover:bg-muted/60 hover:text-foreground text-foreground rounded-lg',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg',
      ghost: 'hover:bg-muted text-foreground rounded-lg',
      destructive:
        'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 rounded-lg',
      vault: 'bg-[#AAFF00] text-[#0B0F14] hover:bg-[#9CE600] font-bold shadow-sm shadow-[#AAFF00]/20 rounded-lg',
    };

    const sizes = {
      sm: 'h-8 px-3 py-1.5 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-11 px-6 py-3 text-base',
      icon: 'h-9 w-9 p-0',
    };

    const combinedClassName = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...props,
        ...child.props,
        className: `${combinedClassName} ${child.props.className || ''}`.trim(),
        ref,
      } as any);
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

