import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { Button } from '../ui/Button';
import { LegacyVaultLogo } from '../ui/LegacyVaultLogo';

export const PublicNavbar: React.FC = () => {
  const { user, vault } = useVault();
  const location = useLocation();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/20 bg-background/90 backdrop-blur-md overflow-x-hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center">
          <LegacyVaultLogo variant="horizontal" size="md" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/how-it-works"
            className={`text-sm font-medium transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isCurrent('/how-it-works') ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            How It Works
          </Link>
          <Link
            to="/security"
            className={`text-sm font-medium transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isCurrent('/security') ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            Security
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user && vault?.profile?.onboarding_complete ? (
            <Button asChild size="sm">
              <Link to="/dashboard">
                Open Vault
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : user ? (
            <Button asChild size="sm">
              <Link to="/onboarding/create">
                Finish Setup
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth?mode=signin">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth?mode=signup">Create Wallet</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
