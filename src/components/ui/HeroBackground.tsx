import React from 'react';

const HeroBackground: React.FC = () => {
  const isReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-24"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isReducedMotion
            ? 'url("/media/legacy-vault-hero.webp")'
            : 'url("/media/legacy-vault-hero.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-80 pointer-events-none"
      />
    </section>
  );
};

export { HeroBackground };