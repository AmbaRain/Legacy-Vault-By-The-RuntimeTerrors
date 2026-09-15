import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VaultProvider } from './context/VaultContext';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SecurityPage } from './pages/SecurityPage';
import { WelcomePage } from './pages/WelcomePage';
import { AuthPage } from './pages/AuthPage';

// Onboarding pages
import { OnboardingSetupPage } from './pages/onboarding/OnboardingSetupPage';
import { OnboardingCreatePage } from './pages/onboarding/OnboardingCreatePage';
import { OnboardingSecurePage } from './pages/onboarding/OnboardingSecurePage';
import { OnboardingReadyPage } from './pages/onboarding/OnboardingReadyPage';

// App layout & Authenticated pages
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';
import { SendPage } from './pages/SendPage';
import { ReceivePage } from './pages/ReceivePage';
import { DepositPage } from './pages/DepositPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { BridgePage } from './pages/BridgePage';
import { LegacyProtectionPage } from './pages/LegacyProtectionPage';
import { LegacyProtectionSetupPage } from './pages/LegacyProtectionSetupPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <VaultProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Marketing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/security" element={<SecurityPage />} />

          {/* Auth & Entry */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Onboarding Flow */}
          <Route path="/onboarding/setup" element={<OnboardingSetupPage />} />
          <Route path="/onboarding/create" element={<OnboardingCreatePage />} />
          <Route path="/onboarding/secure" element={<OnboardingSecurePage />} />
          <Route path="/onboarding/ready" element={<OnboardingReadyPage />} />

          {/* Authenticated Application */}
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            }
          />
          <Route
            path="/assets"
            element={
              <AppLayout>
                <AssetsPage />
              </AppLayout>
            }
          />
          <Route
            path="/transactions"
            element={
              <AppLayout>
                <TransactionsPage />
              </AppLayout>
            }
          />
          <Route
            path="/transactions/:id"
            element={
              <AppLayout>
                <TransactionDetailPage />
              </AppLayout>
            }
          />
          <Route
            path="/send"
            element={
              <AppLayout>
                <SendPage />
              </AppLayout>
            }
          />
          <Route
            path="/receive"
            element={
              <AppLayout>
                <ReceivePage />
              </AppLayout>
            }
          />
          <Route
            path="/deposit"
            element={
              <AppLayout>
                <DepositPage />
              </AppLayout>
            }
          />
          <Route
            path="/withdraw"
            element={
              <AppLayout>
                <WithdrawPage />
              </AppLayout>
            }
          />
          <Route
            path="/bridge"
            element={
              <AppLayout>
                <BridgePage />
              </AppLayout>
            }
          />
          <Route
            path="/legacy-protection"
            element={
              <AppLayout>
                <LegacyProtectionPage />
              </AppLayout>
            }
          />
          <Route
            path="/legacy-protection/setup"
            element={
              <AppLayout>
                <LegacyProtectionSetupPage />
              </AppLayout>
            }
          />
          <Route
            path="/activity"
            element={
              <AppLayout>
                <ActivityPage />
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </VaultProvider>
  );
}
