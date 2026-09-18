import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVault } from '../context/VaultContext';
import { Button } from '../components/ui/Button';
import { LegacyVaultLogo } from '../components/ui/LegacyVaultLogo';

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

  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    <div className="relative min-h-screen min-h-100svf flex flex-col items-center justify-center bg-background px-4">
      {/* Auth background layer with WebP */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          backgroundImage: `url('/media/legacy-vault-hero.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark scrim above WebP, below content */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      {/* Auth content layer above both background layers */}
      <div className="relative z-10 w-full max-w-sm w-full px-4 py-8">
        {/* Glass auth panel with backdrop-filter */}
        <div
          style={{
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
          }}
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center justify-center mb-4">
            <LegacyVaultLogo variant="horizontal" size="lg" showTagline={true} />
          </div>

          <h1 className="mt-2 text-center font-display text-2xl font-bold tracking-tight text-foreground">
            {isSignup ? 'Create your account' : 'Sign in to your vault'}
          </h1>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
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
                <div
                  className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive overflow-hidden"
                >
                  {error}
                </div>
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
                Quick Fill Demo Credentials
              </motion.button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isSignup ? 'Already have an account?' : 'New to Legacy Vault?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
              className="font-semibold text-primary hover:underline cursor-pointer"
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};