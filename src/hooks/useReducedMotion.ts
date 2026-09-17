import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);

    const listener = () => setReducedMotion(media.matches);
    window.addEventListener('change', listener);

    return () => window.removeEventListener('change', listener);
  }, []);

  return reducedMotion;
}