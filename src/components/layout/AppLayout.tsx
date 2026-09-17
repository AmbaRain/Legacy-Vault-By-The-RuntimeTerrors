import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Coins,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  Shuffle,
  CircleDot,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { AddressDisplay } from '../ui/AddressDisplay';
import { LegacyVaultLogo } from '../ui/LegacyVaultLogo';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, vault, signOut } = useVault();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication guard
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  // If user hasn't set up wallet or finished recovery
  if (!vault?.profile?.wallet_address && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding/create" replace />;
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Assets', path: '/assets', icon: Coins },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Send', path: '/send', icon: ArrowUpRight },
    { label: 'Deposit', path: '/deposit', icon: ArrowDownLeft },
    { label: 'Bridge', path: '/bridge', icon: Shuffle },
    { label: 'Legacy Protection', path: '/legacy-protection', icon: Shield },
    { label: 'Activity', path: '/activity', icon: Clock },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/legacy-protection' && location.pathname.startsWith('/legacy-protection')) {
      return true;
    }
    if (path === '/transactions' && location.pathname.startsWith('/transactions')) {
      return true;
    }
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-b border-border bg-sidebar p-4 text-sidebar-foreground md:flex">
        <div className="space-y-6">
          <Link to="/dashboard" className="flex items-center px-2 py-1">
            <LegacyVaultLogo variant="horizontal" size="md" showTagline={true} />
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom account status */}
        <div className="space-y-3 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground">Network</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
              <CircleDot className="h-2 w-2 animate-pulse" />
              Starknet Mainnet
            </span>
          </div>

          <div>
            <span className="font-medium text-muted-foreground">Wallet</span>
            <div className="mt-1">
              <AddressDisplay
                value={vault?.profile?.wallet_address}
                variant="short"
                className="text-sidebar-foreground"
              />
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full items-center justify-center gap-2 rounded-md border bg-sidebar/50 py-1.5 text-xs text-sidebar-foreground/80 transition-colors hover:bg-destructive/20 hover:text-destructive cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer & Top bar */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border/20 bg-background/90 px-4 backdrop-blur md:hidden">
          <Link to="/dashboard" className="flex items-center">
            <LegacyVaultLogo variant="horizontal" size="sm" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md flex items-center justify-center"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X
                className="h-5 w-5 text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Close Menu"
              />
            ) : (
              <Menu
                className="h-5 w-5 text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Open Menu"
              />
            )}
          </button>
        </header>

        {/* Mobile slide-over menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background/95 p-6 backdrop-blur md:hidden pt-16">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium ${
                      active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-6">
              <div className="mb-4">
                <span className="text-xs font-medium text-muted-foreground">Connected Address:</span>
                <div className="mt-1 font-mono text-sm">
                  <AddressDisplay value={vault?.profile?.wallet_address} variant="short" />
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center justify-center rounded-md bg-destructive/10 py-2.5 text-sm font-medium text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around border-0 bg-card/90 px-2 backdrop-blur-md md:hidden">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Home
          </Link>
          <Link
            to="/assets"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive('/assets') ? 'text-primary' : 'text-muted-foreground'
            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            <Coins className="h-5 w-5" />
            Assets
          </Link>
          <Link
            to="/send"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive('/send') ? 'text-primary' : 'text-muted-foreground'
            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            <ArrowUpRight className="h-5 w-5" />
            Send
          </Link>
          <Link
            to="/legacy-protection"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive('/legacy-protection') ? 'text-primary' : 'text-muted-foreground'
            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            <Shield className="h-5 w-5" />
            Legacy
          </Link>
          <Link
            to="/activity"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive('/activity') ? 'text-primary' : 'text-muted-foreground'
            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
          >
            <Clock className="h-5 w-5" />
            Activity
          </Link>
        </div>
      </div>
    </div>
  );
};
