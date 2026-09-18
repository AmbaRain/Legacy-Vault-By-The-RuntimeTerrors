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
    <div className={className}>
      <div
        className={`overflow-y-auto h-full w-full ${overlayClass} rounded-lg border border-border/50 ${motionClass}`}
      >
        <div className="relative flex max-w-lg w-full mx-4 mt-8 p-6 border-border">
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="prose max-w-none">{children}</div>
        </div>
      </div>
    </div>
  );
};