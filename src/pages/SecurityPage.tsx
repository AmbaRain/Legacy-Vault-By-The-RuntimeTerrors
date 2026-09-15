import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, KeyRound, Eye, AlertTriangle, CheckSquare2, ArrowRight } from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Button } from '../components/ui/Button';

export const SecurityPage: React.FC = () => {
  const principles = [
    {
      icon: KeyRound,
      title: 'User-controlled keys',
      description:
        'Your keys never leave your custody. Private cryptographic credentials are never stored on external web servers or accessed without your authorization.',
    },
    {
      icon: Eye,
      title: 'Transparent conditions',
      description:
        'All dormancy parameters, gas reserves, and beneficiary designations are deployed on-chain so you and your heirs know exactly how execution works.',
    },
    {
      icon: AlertTriangle,
      title: 'Honest risk warnings',
      description:
        'Blockchain transfers are immutable. We prominently highlight irreversible actions and provide explicit confirmations for critical operations.',
    },
    {
      icon: CheckSquare2,
      title: 'Clear confirmations',
      description:
        'Heartbeat updates, withdrawals, and bridge transactions clearly itemize network fees, execution times, and remaining balances before submission.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Security at Legacy Vault
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Principles that keep your digital vault resilient and trustworthy.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-3xl bg-secondary/80 p-8 text-center border border-border">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Experience non-custodial peace of mind
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Protect your digital wealth with verifiable Starknet smart contracts.
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
