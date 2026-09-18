import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shuffle,
  Users,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { LegacyVaultLogo, LegacyVaultIcon } from '../components/ui/LegacyVaultLogo';
import { HeroBackground } from '../components/ui/HeroBackground';

export const LandingPage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLHeadingElement>(null);
  const securityRef = useRef<HTMLHeadingElement>(null);
  const ctx = useRef<any | null>();

  // GSAP context for proper cleanup
  useEffect(() => {
    if (reducedMotion) return;

    ctx.current = gsap.context(() => {
      // Hero content reveal using GSAP timeline
      const tl = gsap.timeline({
        defaults: { duration: 0.6, ease: 'power3.out' },
        paused: true,
      });

      const elements = [
        { el: heroRef.current?.querySelector('.hero-label'), offset: 0 },
        { el: heroRef.current?.querySelector('.hero-heading'), offset: '-=0.3' },
        { el: heroRef.current?.querySelector('.hero-copy'), offset: '-=0.3' },
        { el: heroRef.current?.querySelector('.primary-cta'), offset: '-=0.3' },
        { el: heroRef.current?.querySelector('.secondary-cta'), offset: '-=0.2' },
      ];

      elements.forEach(({ el, offset }) => {
        if (el) {
          tl.from(el, { opacity: 0, y: 20 + (offset ? (offset as any) * 10 : 0) });
        }
      });

      tl.play();
    });

    return () => {
      ctx.current?.revert();
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    ctx.current = gsap.context(() => {
      const featuresHeading = featuresRef.current;
      const stepsHeading = stepsRef.current;
      const securityHeading = securityRef.current;

      const featuresTl = gsap.timeline({
        defaults: { duration: 0.6, ease: 'power3.out' },
        paused: true,
      });

      const stepsTl = gsap.timeline({
        defaults: { duration: 0.6, ease: 'power3.out' },
        paused: true,
      });

      const securityTl = gsap.timeline({
        defaults: { duration: 0.6, ease: 'power3.out' },
        paused: true,
      });

      if (featuresHeading) {
        featuresTl.from(featuresHeading, { opacity: 0, y: 20 });
      }

      if (stepsHeading) {
        stepsTl.from(stepsHeading, { opacity: 0, y: 20 });
      }

      if (securityHeading) {
        securityTl.from(securityHeading, { opacity: 0, y: 20 });
      }

      featuresTl.play();
      stepsTl.play();
      securityTl.play();
    });

    return () => {
      ctx.current?.revert();
    };
  }, [reducedMotion]);

  const features = [
    {
      icon: Wallet,
      title: 'Secure Wallet',
      description: 'Account abstraction on Starknet with programmable guardrails and modern key recovery.',
    },
    {
      icon: ArrowDownLeft,
      title: 'Deposit & Withdraw',
      description: 'Seamlessly fund your vault and withdraw to any external address whenever you need.',
    },
    {
      icon: ArrowUpRight,
      title: 'Send & Receive',
      description: 'Instant, low-fee token transfers across supported assets including ETH, STRK, and USDC.',
    },
    {
      icon: Shuffle,
      title: 'L1 & L2 Bridge',
      description: 'Effortlessly transfer digital assets between Ethereum and Starknet with deep liquidity.',
    },
    {
      icon: Users,
      title: 'Next of Kin Protocol',
      description: 'Designate trusted beneficiary addresses that receive your assets if dormancy triggers.',
    },
    {
      icon: Clock,
      title: 'Heartbeat Protection',
      description: 'Qualifying on-chain transactions automatically reset your timer, keeping you in control.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Connect or Create',
      description: 'Generate a fresh Starknet vault address or link your existing wallet in seconds.',
      icon: Wallet,
    },
    {
      number: '02',
      title: 'Configure Inheritance',
      description: 'Specify your next of kin, choose a dormancy period (30–365 days), and fund gas reserve.',
      icon: Shuffle,
    },
    {
      number: '03',
      title: 'Rest Assured',
      description: 'Smart contracts enforce your instructions transparently without trusting third-party custodians.',
      icon: Clock,
    },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <HeroBackground />

      <motion.div
        ref={heroRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.5,
          ease: 'power3.out',
        }}
        reducedMotion={reducedMotion}
        className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 sm:pt-20"
      >
        <span className="text-xs font-bold tracking-[0.25em] text-[#8E95A0] uppercase">
          More Than A Wallet
        </span>

        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          A secure home <br className="hidden sm:block" />
          <span className="text-[#AAFF00]">your future.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg">
          Legacy Vault is a crypto platform built for people who think long term. Store, manage and grow your
          digital assets with security, simplicity and control — because your wealth deserves a legacy.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="vault-button-solid w-full sm:w-auto text-base">
            <Link to="/auth?mode=signup">
              Create a Vault
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base border-border bg-card">
            <Link to="/how-it-works">How It Works</Link>
          </Button>
        </div>
      </motion.div>

      {/* Hero Feature Box Preview */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
          reducedMotion={reducedMotion}
          className="vault-surface overflow-hidden rounded-3xl p-6 sm:p-10 shadow-2xl border border-vault/20"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Autonomous Asset Security
              </span>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-vault-foreground">
                Set your legacy. Protect what matters.
              </h2>
              <p className="mt-2 text-sm sm:text-base text-vault-foreground/80 max-w-xl">
                Traditional wallets disappear forever if your keys are lost. Legacy Vault introduces
                inactivity heartbeats that safeguard your family's financial future without giving up your custody.
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} reducedMotion={reducedMotion}>
              <Button asChild className="vault-button-solid self-start md:self-auto shrink-0">
                <Link to="/welcome">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium text-vault-foreground">No KYC or paperwork</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium text-vault-foreground">Self-custodial Starknet code</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium text-vault-foreground">Adjustable dormancy periods</span>
            </div>
</div>

    </motion.div>
  </section>

  {/* Core Features Grid */}
      <section className="bg-muted/40 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground" ref={featuresRef}>
              Everything you need for everyday crypto and tomorrow's peace of mind
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Manage balances, bridge tokens, send transactions, and automate succession planning in one seamless interface.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: reducedMotion ? 0 : 0.4, delay: i * 0.08 }}
                  whileHover={{ y: -5, transition: { duration: reducedMotion ? 0 : 0.2 } }}
                  reducedMotion={reducedMotion}
                >
                  <Card className="h-full border-border/80 transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                        {f.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {f.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works 3 Steps */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Simple 3-Step Setup
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground" ref={stepsRef}>
              How Legacy Vault works
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Set up your protection once, and your on-chain activity does the rest.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.12 }}
                  whileHover={{ y: -4, transition: { duration: reducedMotion ? 0 : 0.2 } }}
                  reducedMotion={reducedMotion}
                >
                  <Card className="h-full border-border/80 transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {s.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Principles Banner */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-border bg-secondary/60 p-8 sm:p-12 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-foreground" ref={securityRef}>
            Security by cryptographic design
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
            No middleman holds your keys. No company can freeze your assets. Your succession rules
            execute strictly according to verified cryptographic code.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline">
              <Link to="/security">Read Security Principles</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?mode=signup">Open Vault Now</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground bg-[#0E1217]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <LegacyVaultLogo variant="horizontal" size="sm" showTagline={true} />
          <p>© 2026 Legacy Vault. Built on Starknet.</p>
          <div className="flex gap-4">
            <Link to="/how-it-works" className="hover:underline hover:text-[#AAFF00]">How It Works</Link>
            <Link to="/security" className="hover:underline hover:text-[#AAFF00]">Security</Link>
            <Link to="/auth" className="hover:underline hover:text-[#AAFF00]">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};