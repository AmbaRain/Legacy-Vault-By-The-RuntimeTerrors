import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVault } from '../context/VaultContext';
import { Button } from '../components/ui/Button';
import { LegacyVaultLogo } from '../components/ui/LegacyVaultLogo';
import { HeroBackground } from '../components/ui/HeroBackground';

export const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, signIn, vault } = useVault();

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError('');
    setSearchParams({ mode: newMode });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }

      // Check if user already completed onboarding
      if (vault?.profile?.onboarding_complete) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding/create');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('alex@legacyvault.stark');
    setPassword('vault123456');
    setSubmitting(true);
    setError('');
    try {
      await signIn('alex@legacyvault.stark', 'vault123456');
      navigate('/onboarding/create');
    } catch (err: any) {
      setError(err.message || 'Demo sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-4 py-12">
      {/* Animated 3D Vault Video Ambient Background */}
      <HeroBackground opacity={0.9} showOverlay={true} />

      {/* Floating Video Status Indicator */}
      <div className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-[#AAFF00]/40 bg-black/80 px-3.5 py-1.5 text-xs font-mono font-medium text-white shadow-2xl backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#AAFF00] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#AAFF00]" />
        </span>
        <span className="text-[#AAFF00] font-bold">3D VAULT ENGINE</span>
        <span className="text-zinc-400">• LIVE AMBIENT LOOP</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#AAFF00]/30 bg-[#0E1217]/85 p-7 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black ring-1 ring-white/15"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center">
          <LegacyVaultLogo variant="horizontal" size="lg" showTagline={true} />
        </div>

        <h1 className="mt-6 text-center font-display text-2xl font-bold tracking-tight text-foreground">
          {isSignup ? 'Create your account' : 'Sign in to your vault'}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? isSignup
                ? 'Creating account...'
                : 'Signing in...'
              : isSignup
              ? 'Create account'
              : 'Sign In'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* Quick Demo Assist */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleQuickDemo}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-card/60 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Quick Fill Demo Credentials
            </motion.button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? 'Already have an account?' : 'New to Legacy Vault?'}{' '}
          <button
            type="button"
            onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
            className="font-semibold text-primary hover:underline cursor-pointer"
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
