import React from 'react';

interface LegacyVaultLogoProps {
  variant?: 'icon' | 'app-icon' | 'horizontal' | 'full' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

/**
 * Exact geometric vector of the Legacy Vault hexagonal keyhole emblem
 * rendered in brand Neon Lime (#AAFF00).
 */
export const LegacyVaultIcon: React.FC<{
  size?: number;
  className?: string;
  color?: string;
}> = ({ size = 36, className = '', color = '#AAFF00' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Legacy Vault Emblem"
    >
      {/* Outer Hexagon with rounded corners and keyhole channel cutout */}
      <path
        d="M 50 5
           L 89 27.5
           A 3 3 0 0 1 90.5 30
           L 90.5 70
           A 3 3 0 0 1 89 72.5
           L 50 95
           A 3 3 0 0 1 48.5 95
           L 11 72.5
           A 3 3 0 0 1 9.5 70
           L 9.5 30
           A 3 3 0 0 1 11 27.5
           L 50 5 Z"
        stroke={color}
        strokeWidth="10"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Inner Keyhole Chamber Silhouette */}
      {/* Head: Circle at (50, 42) r=9 */}
      {/* Stem: vertical slot from y=48 down to y=67 */}
      <path
        d="M 44.5 44
           A 8 8 0 1 1 55.5 44
           L 57 66
           A 1.5 1.5 0 0 1 55.5 67.5
           L 44.5 67.5
           A 1.5 1.5 0 0 1 43 66
           Z"
        fill={color}
      />

      {/* Internal Vault Shield Ring Accent */}
      <path
        d="M 50 18
           L 77 33.5
           L 77 66.5
           L 50 82
           L 23 66.5
           L 23 33.5
           Z"
        stroke={color}
        strokeWidth="3.5"
        strokeOpacity="0.4"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const LegacyVaultLogo: React.FC<LegacyVaultLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 44,
    xl: 64,
  };

  const currentIconSize = iconSizes[size];

  if (variant === 'icon') {
    return <LegacyVaultIcon size={currentIconSize} className={className} />;
  }

  if (variant === 'app-icon') {
    const squircleSizes = {
      sm: 'h-9 w-9 rounded-xl p-1',
      md: 'h-12 w-12 rounded-2xl p-1.5',
      lg: 'h-16 w-16 rounded-3xl p-2',
      xl: 'h-24 w-24 rounded-4xl p-3',
    };

    return (
      <div
        className={`flex items-center justify-center bg-[#1E2329] border border-[#2A3038] shadow-xl ${squircleSizes[size]} ${className}`}
      >
        <LegacyVaultIcon size={currentIconSize} />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <LegacyVaultIcon size={currentIconSize} />
        <div className="mt-3">
          <div className="font-display font-bold leading-tight tracking-tight">
            <span className="text-[#E8E8EA]">Legacy</span>{' '}
            <span className="text-[#AAFF00]">Vault</span>
          </div>
          {(showTagline || size === 'lg' || size === 'xl') && (
            <p className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-[#8E95A0] uppercase">
              Your Crypto. Your Legacy.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default 'horizontal' or 'full'
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LegacyVaultIcon size={currentIconSize} />
      <div className="flex flex-col">
        <div className={`font-display font-extrabold tracking-tight ${textSizes[size]}`}>
          <span className="text-[#E8E8EA]">Legacy </span>
          <span className="text-[#AAFF00]">Vault</span>
        </div>
        {(showTagline || variant === 'full') && (
          <span className="text-[9px] font-bold tracking-[0.18em] text-[#8E95A0] uppercase">
            Your Crypto. Your Legacy.
          </span>
        )}
      </div>
    </div>
  );
};
