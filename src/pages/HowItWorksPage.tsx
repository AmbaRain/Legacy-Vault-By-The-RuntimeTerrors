import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, ShieldCheck, UserCheck, Clock, Zap } from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Button } from '../components/ui/Button';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: 1,
      icon: Wallet,
      title: 'Connect wallet',
      description: 'Generate a fresh Starknet account abstraction vault or link your existing Starknet wallet in seconds.',
    },
    {
      num: 2,
      icon: ShieldCheck,
      title: 'Secure assets',
      description: 'Deposit the digital assets (ETH, STRK, USDC) you wish to manage and protect for the long term.',
    },
    {
      num: 3,
      icon: UserCheck,
      title: 'Choose next of kin',
      description: 'Designate the trusted Starknet wallet address that will inherit your vault assets if inactivity triggers.',
    },
    {
      num: 4,
      icon: Clock,
      title: 'Set dormancy period',
      description: 'Choose an inactivity threshold (30 days, 90 days, 180 days, or 1 year). Any qualifying on-chain transaction or manual heartbeat resets your timer.',
    },
    {
      num: 5,
      icon: Zap,
      title: 'Vault executes autonomously',
      description: 'If your dormancy timer lapses without qualifying activity, the pre-authorized smart contract executes the transfer safely to your beneficiary.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            How Legacy Vault Works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Programmable crypto inheritance in five simple steps.
          </p>
        </div>

        <div className="mt-16 space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex flex-col sm:flex-row items-start gap-5 rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-display text-lg font-bold">
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-3xl bg-secondary/80 p-8 text-center border border-border">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Ready to secure your crypto legacy?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Setup takes less than two minutes. Non-custodial, open, and automated.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/auth?mode=signup">
              Open Legacy Vault
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};
