import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  Check,
  Copy,
  Wallet,
  CheckCircle2,
  CreditCard,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { AssetSymbol } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SUPPORTED_ASSETS } from '../utils/format';
import { PaystackModal } from '../components/paystack/PaystackModal';
import {
  convertNgnToCrypto,
  NGN_EXCHANGE_RATES,
  PAYSTACK_PUBLIC_KEY,
  PaystackSuccessResponse,
} from '../lib/paystack';

const NGN_TIERS = [
  { label: '₦25,000', value: 25000, desc: '~$16.67 USDC' },
  { label: '₦75,000', value: 75000, desc: '~$50.00 USDC' },
  { label: '₦150,000', value: 150000, desc: '~$100.00 USDC' },
  { label: '₦300,000', value: 300000, desc: '~$200.00 USDC' },
];

export const DepositPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { vault, deposit } = useVault();

  const initialTab = searchParams.get('tab') === 'crypto' ? 'crypto' : 'paystack';
  const [activeTab, setActiveTab] = useState<'paystack' | 'crypto'>(initialTab);

  // Paystack On-Ramp state
  const [ngnAmount, setNgnAmount] = useState<number>(75000);
  const [customNgn, setCustomNgn] = useState<string>('75000');
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const [onRampSuccess, setOnRampSuccess] = useState<PaystackSuccessResponse | null>(null);

  // Crypto Transfer state
  const defaultAsset = (searchParams.get('asset') as AssetSymbol) || 'USDC';
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>(defaultAsset);
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [cryptoSuccess, setCryptoSuccess] = useState(false);
  const [error, setError] = useState('');

  const walletAddress = vault?.profile?.wallet_address;
  const userEmail = vault?.profile?.email || 'user@example.com';

  if (!walletAddress) {
    return (
      <div className="pb-24 md:pb-8">
        <EmptyState
          icon={Wallet}
          title="Wallet not ready"
          description="Finish wallet setup before depositing."
          action={
            <Button asChild>
              <Link to="/onboarding/create">Set up wallet</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSelectNgnTier = (val: number) => {
    setNgnAmount(val);
    setCustomNgn(val.toString());
  };

  const handleCustomNgnChange = (val: string) => {
    setCustomNgn(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setNgnAmount(num);
    }
  };

  const conversion = convertNgnToCrypto(ngnAmount, 0);

  const handlePaystackOnRampSuccess = async (response: PaystackSuccessResponse) => {
    setIsPaystackOpen(false);
    setOnRampSuccess(response);

    try {
      // Deposit the USDC into the user's vault
      await deposit({
        asset: 'USDC',
        amount: response.usdEquivalent,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCryptoSuccess(false);

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid deposit amount greater than 0.');
      return;
    }

    setPending(true);
    try {
      await deposit({
        asset: selectedAsset,
        amount: parsed,
      });
      setCryptoSuccess(true);
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Deposit simulation failed.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Deposit & On-Ramp
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fund your non-custodial Starknet vault via Paystack NGN or crypto transfer
          </p>
        </div>
      </div>

      {/* Primary Tab Switcher: Paystack On-Ramp vs Crypto */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('paystack');
            setSearchParams({ tab: 'paystack' });
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'paystack'
              ? 'bg-[#0BA4DB] text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Paystack NGN On-Ramp</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('crypto');
            setSearchParams({ tab: 'crypto' });
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'crypto'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Crypto Transfer</span>
        </button>
      </div>

      {/* Tab 1: Paystack NGN On-Ramp */}
      {activeTab === 'paystack' && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0BA4DB]" />
                Buy Crypto with Naira (NGN)
              </CardTitle>
              <span className="rounded-full bg-[#0BA4DB]/15 border border-[#0BA4DB]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#0BA4DB]">
                PAYSTACK TESTNET
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instantly buy USDC on Starknet using Nigerian Naira (NGN) via debit card, bank
              transfer, or USSD through Paystack.
            </p>

            {/* NGN Preset Tiers */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Quick Select Amount
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {NGN_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => handleSelectNgnTier(tier.value)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                      ngnAmount === tier.value
                        ? 'border-[#0BA4DB] bg-[#0BA4DB]/15 text-[#00C3F7] font-bold shadow-xs'
                        : 'border-border bg-card text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold">{tier.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom NGN Input */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Or Custom Naira Amount (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-mono text-sm font-bold text-muted-foreground">
                  ₦
                </span>
                <input
                  type="number"
                  value={customNgn}
                  onChange={(e) => handleCustomNgnChange(e.target.value)}
                  placeholder="75000"
                  className="w-full rounded-xl border border-input bg-card pl-8 pr-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0BA4DB]"
                  required
                />
              </div>
            </div>

            {/* Rate & Conversion Summary */}
            <div className="rounded-xl border border-[#0BA4DB]/30 bg-[#0BA4DB]/5 p-4 text-xs space-y-2 font-mono">
              <div className="flex justify-between font-sans text-muted-foreground">
                <span>FX Rate:</span>
                <span className="font-mono text-foreground">
                  1 USD = ₦{NGN_EXCHANGE_RATES.NGN_PER_USD.toLocaleString()} NGN
                </span>
              </div>
              <div className="flex justify-between font-sans text-muted-foreground">
                <span>Destination Vault:</span>
                <span className="font-mono text-foreground">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#0BA4DB]/20 pt-2 font-sans font-semibold">
                <span className="text-foreground">You Receive on Starknet:</span>
                <span className="font-mono text-sm font-bold text-[#00C3F7]">
                  ${(ngnAmount / NGN_EXCHANGE_RATES.NGN_PER_USD).toFixed(2)} USDC
                </span>
              </div>
            </div>

            {/* Success message */}
            {onRampSuccess && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-sans">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Deposit Confirmed via Paystack!</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-sans">
                  <span>Reference:</span>
                  <span className="text-foreground font-mono">{onRampSuccess.reference}</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-sans">
                  <span>Credited:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    +${onRampSuccess.usdEquivalent} USDC
                  </span>
                </div>
              </div>
            )}

            <Button
              type="button"
              className="w-full bg-[#0BA4DB] text-white hover:bg-[#09A5DB] py-6 text-sm font-bold shadow-lg"
              size="lg"
              onClick={() => setIsPaystackOpen(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ₦{ngnAmount.toLocaleString()} with Paystack
            </Button>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
              <span>Public Key: {PAYSTACK_PUBLIC_KEY.slice(0, 16)}...</span>
              <span className="text-emerald-400">Card • Transfer • USSD</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Direct Starknet Crypto Transfer */}
      {activeTab === 'crypto' && (
        <>
          {/* Your Deposit Address */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Your Starknet Deposit Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Transfer assets directly to this address from an external wallet (Argent X, Braavos) or exchange on Starknet.
              </p>

              <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                <p className="break-all font-mono text-xs text-foreground select-all">
                  {walletAddress}
                </p>
              </div>

              <Button onClick={handleCopy} variant="outline" className="w-full" size="sm">
                {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy address'}
              </Button>
            </CardContent>
          </Card>

          {/* Simulate Deposit for testing */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Simulate L2 Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSimulateDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Asset</label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value as AssetSymbol)}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {SUPPORTED_ASSETS.map((asset) => (
                      <option key={asset.symbol} value={asset.symbol}>
                        {asset.symbol} — {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Amount</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {error && <p className="text-xs text-destructive font-medium">{error}</p>}
                {cryptoSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Deposit successfully recorded and vault balance updated.
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={pending || !amount}
                >
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  {pending ? 'Recording deposit...' : 'Record deposit'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {/* Paystack Popup Modal */}
      <PaystackModal
        isOpen={isPaystackOpen}
        config={{
          email: userEmail,
          amountNgn: ngnAmount,
          onSuccess: handlePaystackOnRampSuccess,
          onCancel: () => setIsPaystackOpen(false),
        }}
        onClose={() => setIsPaystackOpen(false)}
      />
    </div>
  );
};
