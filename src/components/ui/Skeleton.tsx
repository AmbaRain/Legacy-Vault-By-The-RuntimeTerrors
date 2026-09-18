import React from 'react';

export const Skeleton: React.FC = () => (
  <div className="animate-pulse rounded-md h-8 w-full bg-muted/50" />
);

export const SkeletonCard: React.FC = ({ className }: { className?: string }) => (
  <div
    className={`rounded-xl border border-border/60 bg-muted/20 p-6 animate-pulse ${className}`}
  />
);

export const SkeletonLine: React.FC = ({ className, width }: { className?: string; width?: string }) => (
  <div
    className={`h-2 rounded-full bg-muted/50 w-full ${width ? `w-${width}` : ''} ${className}`}
  />
);

export const SkeletonButton: React.FC = ({ className }: { className?: string }) => (
  <div className={`rounded-full h-8 w-24 bg-muted/50 ${className}`} />
);