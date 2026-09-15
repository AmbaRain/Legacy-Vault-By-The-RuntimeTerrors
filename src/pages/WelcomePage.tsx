import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LegacyVaultIcon } from '../components/ui/LegacyVaultLogo';
import { Button } from '../components/ui/Button';

export const WelcomePage: React.FC = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4 overflow-hidden">
      {/* Background ambient neon lime radial glow matching the visual */}
      <div className="pointer-events-none absolute -top-40 h-96 w-96 rounded-full bg-[#AAFF00]/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm text-center relative z-10"
      >
        {/* Large Hexagonal Keyhole Brand Logo */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-4xl bg-[#1E2329] border border-[#2A3038] shadow-2xl shadow-[#AAFF00]/15"
        >
          <LegacyVaultIcon size={72} />
        </motion.div>

        {/* Wordmark */}
        <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight">
          <span className="text-[#E8E8EA]">Legacy </span>
          <span className="text-[#AAFF00]">Vault</span>
        </h1>

        <p className="mt-2 text-xs font-bold tracking-[0.25em] text-[#8E95A0] uppercase">
          Your Crypto. Your Legacy.
        </p>

        <p className="mt-5 text-sm text-[#8E95A0] leading-relaxed max-w-xs mx-auto">
          A secure home for your future. Manage, protect, and pass on your digital assets with confidence.
        </p>

        <div className="mt-10 space-y-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button asChild className="vault-button-solid w-full h-12 text-base font-bold shadow-lg" size="lg">
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button asChild variant="outline" className="w-full h-12 text-base border-[#2A3038] bg-[#1E2329] text-[#E8E8EA] hover:bg-[#252B33]" size="lg">
              <Link to="/auth?mode=signin">Log In</Link>
            </Button>
          </motion.div>
        </div>

        <div className="mt-8">
          <Link to="/" className="text-xs text-[#8E95A0] hover:text-[#AAFF00] transition-colors">
            ← Back to Homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
