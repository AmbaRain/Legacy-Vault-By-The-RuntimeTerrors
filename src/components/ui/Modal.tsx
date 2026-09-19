import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  className = 'fixed inset-0 z-50',
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = () => setReducedMotion(mq.matches);
    window.addEventListener('change', listener);
    return () => window.removeEventListener('change', listener);
  }, []);

  if (!open) return null;

  const motionClass = reducedMotion ? 'transition-none' : 'transition-opacity duration-200';
  const overlayClass = reducedMotion ? 'fixed inset-0 bg-black/50' : 'fixed inset-0 bg-black/50 backdrop-blur-sm';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      <div
        className={`fixed inset-0 ${overlayClass} ${motionClass}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col max-w-lg w-full rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {title && (
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <h2 className="font-display font-semibold text-lg text-foreground">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};