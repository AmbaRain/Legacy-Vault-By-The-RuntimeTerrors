import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  Check,
  Wallet,
  ArrowLeft,
  CreditCard,
  Layers,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatShortAddress, isValidStarknetAddress } from '../utils/format';
import { PaystackModal } from '../components/paystack/PaystackModal';
import { convertNgnToCrypto, PaystackSuccessResponse, NGN_EXCHANGE_RATES, PAYSTACK_PUBLIC_KEY } from '../lib/paystack';
import { ContractCallBuilder, STARKNET_TOKENS } from '../lib/starknet';

const DORMANCY_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '1 year', value: 365 },
];

const NGN_TIERS = [
  { label: '₦75,000', value: 75000, desc: '~$50 USDC + Gas' },
  { label: '₦150,000', value: 150000, desc: '~$100 USDC + Gas' },
  { label: '₦300,000', value: 300000, desc: '~$200 USDC + Gas' },
];

export const LegacySetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { vault, setupLegacyProtection } = useVault();

  const legacy = vault?.legacy;
  const walletAddress = vault?.profile?.wallet_address;
  const userEmail = vault?.profile?.email || 'user@example.com';

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [beneficiary, setBeneficiary] = useState(
    legacy?.next_of_kin || '0x04bf6578a1670929a4a7537b83d16ca1f2113222e43bc09e9929288f3be1890b'
  );
  const [dormancyDays, setDormancyDays] = useState<number>(legacy?.dormancy_days ?? 180);
  const [gasReserve, setGasReserve] = useState<number>(legacy?.gas_reserve ?? 0.05);

  // NGN On-Ramp funding state
  const [ngnAmount, setNgnAmount] = useState<number>(150000);
  const [customNgn, setCustomNgn] = useState<string>('150000');
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);

  // Multicall execution state
  const [multicallStatus, setMulticallStatus] = useState<
    'idle' | 'executing' | 'confirmed' | 'failed'
  >('idle');
  const [multicallStep, setMulticallStep] = useState<number>(0);
  const [starknetTxHash, setStarknetTxHash] = useState<string>('');
  const [paystackReceipt, setPaystackReceipt] = useState<PaystackSuccessResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState('');

  if (!walletAddress) {
    return (
      <div className="pb-24 md:pb-8">
        <EmptyState
          icon={Wallet}
          title="Wallet not ready"
          description="Finish wallet setup before configuring legacy protection."
          action={
            <Button asChild>
              <Link to="/onboarding/create">Set up wallet</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const cryptoConversion = convertNgnToCrypto(ngnAmount, gasReserve);

  const validateBeneficiary = () => {
    if (!beneficiary.trim()) {
      setError('Please enter a beneficiary Starknet address or identifier.');
      return false;
    }
    if (
      isValidStarknetAddress(beneficiary) &&
      beneficiary.toLowerCase() === walletAddress.toLowerCase()
    ) {
      setError('Beneficiary address cannot be your own current wallet.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSelectNgnTier = (amount: number) => {
    setNgnAmount(amount);
    setCustomNgn(amount.toString());
  };

  const handleCustomNgnChange = (val: string) => {
    setCustomNgn(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setNgnAmount(num);
    }
  };

  // Called when Paystack completes successfully
  const handlePaystackSuccess = async (response: PaystackSuccessResponse) => {
    setIsPaystackOpen(false);
    setPaystackReceipt(response);
    setStep(4);
    await executeStarknetMulticall(response);
  };

  const executeStarknetMulticall = async (paymentResponse: PaystackSuccessResponse) => {
    setMulticallStatus('executing');
    setError('');

    try {
      // 1. Build Multicall: approve gas reserve, fund vault, configure_inheritance
      const vaultContract = STARKNET_TOKENS.DEFAULT_VAULT;
      const strkToken = STARKNET_TOKENS.STRK_SEPOLIA;
      const usdcToken = STARKNET_TOKENS.USDC_SEPOLIA;

      // Gas reserve: e.g. 0.05 STRK = 5 * 10^16 wei
      const gasReserveWei = (gasReserve * 1e18).toString();
      // Vault funding in USDC: 6 decimals
      const usdcAmountSmallest = Math.floor(paymentResponse.usdEquivalent * 1e6).toString();

      // Multicall calls array
      const approveCall = ContractCallBuilder.approveToken(strkToken, vaultContract, gasReserveWei);
      const fundCall = ContractCallBuilder.fundVault(vaultContract, usdcToken, usdcAmountSmallest);
      const configureCall = ContractCallBuilder.configureInheritance(
        vaultContract,
        beneficiary.trim(),
        dormancyDays,
        gasReserveWei,
        strkToken
      );

      console.info('[Starknet Multicall Batch Prepared]:', [approveCall, fundCall, configureCall]);

      // Multicall Step 1: Approve Gas Reserve
      setMulticallStep(1);
      await new Promise((r) => setTimeout(r, 900));

      // Multicall Step 2: Fund Vault
      setMulticallStep(2);
      await new Promise((r) => setTimeout(r, 900));

      // Multicall Step 3: Configure Inheritance
      setMulticallStep(3);
      await new Promise((r) => setTimeout(r, 1000));

      // Multicall Confirmed on L2
      const fakeTxHash = `0x03${Array.from({ length: 62 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      setStarknetTxHash(fakeTxHash);
      setMulticallStep(4);
      setMulticallStatus('confirmed');

      // Update Vault context
      await setupLegacyProtection({
        nextOfKin: beneficiary.trim(),
        dormancyDays,
        gasReserve,
      });

      setStep(5);
    } catch (err: any) {
      console.error(err);
      setMulticallStatus('failed');
      setError(err.message || 'Starknet multicall execution failed.');
    }
  };

  const beneficiaryClaimUrl = `${window.location.origin}/claim?vault=${walletAddress}&beneficiary=${encodeURIComponent(
    beneficiary.trim()
  )}`;

  const handleCopyClaimLink = () => {
    navigator.clipboard.writeText(beneficiaryClaimUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-24 md:pb-8">
      {/* Back button and page title */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/legacy-protection">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Legacy Protection
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Legacy Protection Setup
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            NGN On-Ramp • Starknet Multicall • Programmable Inheritance
          </p>
        </div>
        <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1 text-[11px] font-semibold text-primary">
          Step {step} of 5
        </span>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-5 gap-1.5 text-center text-[11px] font-semibold">
        {[
          { num: 1, label: '1. Beneficiary' },
          { num: 2, label: '2. Dormancy' },
          { num: 3, label: '3. NGN Ramp' },
          { num: 4, label: '4. Multicall' },
          { num: 5, label: '5. Done' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num as any)}
            className={`rounded-lg py-2 border transition-all cursor-pointer ${
              step === s.num
                ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                : step > s.num
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Step 1: Beneficiary Identifier */}
      {step === 1 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Designate Beneficiary (Next of Kin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the Starknet address or beneficiary identifier who should inherit and be
              authorized to claim your vault balance upon dormancy.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Beneficiary Identifier / Starknet Address
              </label>
              <input
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="0x04bf6578a1670929a4a7537b83d16ca1f2113222e43bc09e9929288f3be1890b"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Supports Starknet L2 account addresses, ENS/Starknet IDs, or designated next-of-kin identifiers.
              </p>
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (validateBeneficiary()) setStep(2);
              }}
            >
              <span>Continue to Dormancy Period</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Dormancy & Gas Reserve */}
      {step === 2 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Choose Dormancy & Autonomous Gas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              If no qualifying on-chain transactions or heartbeats occur for this period, your
              beneficiary becomes eligible to execute the inheritance claim.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Dormancy Period Threshold
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {DORMANCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDormancyDays(opt.value)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all cursor-pointer ${
                      dormancyDays === opt.value
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-card text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span className="font-display text-base font-bold">{opt.label}</span>
                    <span className="mt-0.5 text-[11px] text-muted-foreground">
                      {opt.value === 365 ? '12 months inactivity' : `${opt.value} days inactivity`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Autonomous Gas Reserve (STRK)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={gasReserve}
                onChange={(e) => setGasReserve(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Pre-funds the contract so future settlement executes autonomously with zero gas needed from your beneficiary.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={() => setStep(3)}>
              <span>Continue to NGN On-Ramping</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Back
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: NGN On-Ramping with Paystack Gateway */}
      {step === 3 && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>NGN On-Ramping (Paystack Gateway)</CardTitle>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  Key: {PAYSTACK_PUBLIC_KEY.slice(0, 18)}...
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-[#0BA4DB]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#00C3F7]">
                <CreditCard className="h-3.5 w-3.5" />
                Paystack Testnet
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fund your Starknet vault and gas reserve directly with Nigerian Naira (NGN). We will
              exchange NGN to USDC and allocate your STRK gas reserve on-chain.
            </p>

            {/* Presets */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Select NGN Funding Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NGN_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => handleSelectNgnTier(tier.value)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all cursor-pointer ${
                      ngnAmount === tier.value
                        ? 'border-[#0BA4DB] bg-[#0BA4DB]/15 text-[#00C3F7] font-bold shadow-xs'
                        : 'border-border bg-card text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span className="font-mono text-sm font-bold">{tier.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom NGN Input */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Or Enter Custom Naira (NGN) Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-mono text-sm font-bold text-muted-foreground">
                  ₦
                </span>
                <input
                  type="number"
                  value={customNgn}
                  onChange={(e) => handleCustomNgnChange(e.target.value)}
                  placeholder="150000"
                  className="w-full rounded-xl border border-input bg-card pl-8 pr-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0BA4DB]"
                  required
                />
              </div>
            </div>

            {/* Conversion Calculation Breakdown */}
            <div className="rounded-xl border border-[#0BA4DB]/30 bg-[#0BA4DB]/5 p-4 text-xs space-y-2 font-mono">
              <div className="flex justify-between font-sans text-muted-foreground">
                <span>FX Exchange Rate:</span>
                <span className="font-mono text-foreground">1 USD = ₦{NGN_EXCHANGE_RATES.NGN_PER_USD.toLocaleString()} NGN</span>
              </div>
              <div className="flex justify-between font-sans text-muted-foreground">
                <span>Vault Funding Allocation:</span>
                <span className="font-mono font-bold text-foreground">
                  ${cryptoConversion.vaultFundUsdc} USDC
                </span>
              </div>
              <div className="flex justify-between font-sans text-muted-foreground">
                <span>Gas Reserve Allocation:</span>
                <span className="font-mono font-bold text-foreground">
                  {cryptoConversion.gasReserveStrk} STRK (₦{cryptoConversion.gasCostNgn})
                </span>
              </div>
              <div className="flex justify-between border-t border-[#0BA4DB]/20 pt-2 font-sans font-semibold">
                <span className="text-foreground">Total On-Ramp:</span>
                <span className="font-mono text-sm text-[#00C3F7]">
                  ₦{ngnAmount.toLocaleString()} NGN
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-[#0BA4DB] text-white hover:bg-[#09A5DB]"
              size="lg"
              onClick={() => setIsPaystackOpen(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ₦{ngnAmount.toLocaleString()} via Paystack
            </Button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Back
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Starknet Multicall Execution */}
      {step === 4 && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Starknet Atomic Multicall</CardTitle>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary flex items-center gap-1">
                <Layers className="h-3 w-3" />
                3 Calls in 1 Tx
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Payment confirmed! Executing the atomic Starknet multicall to approve gas reserve,
              fund the vault, and configure inheritance rules.
            </p>

            {/* Multicall Step List */}
            <div className="space-y-3">
              {/* Multicall Call 1 */}
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs transition-colors ${
                  multicallStep >= 1
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <div className="mt-0.5">
                  {multicallStep > 1 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : multicallStep === 1 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border text-[10px]">
                      1
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Call 1: Approve Gas Reserve</span>
                    <span className="font-mono text-[10px]">entrypoint: approve</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Approves {gasReserve} STRK to the Legacy Vault inheritance contract.
                  </p>
                </div>
              </div>

              {/* Multicall Call 2 */}
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs transition-colors ${
                  multicallStep >= 2
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <div className="mt-0.5">
                  {multicallStep > 2 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : multicallStep === 2 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border text-[10px]">
                      2
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Call 2: Fund Vault</span>
                    <span className="font-mono text-[10px]">entrypoint: fund_vault</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Deposits ${cryptoConversion.vaultFundUsdc} USDC liquidity from Paystack on-ramp into the vault.
                  </p>
                </div>
              </div>

              {/* Multicall Call 3 */}
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs transition-colors ${
                  multicallStep >= 3
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <div className="mt-0.5">
                  {multicallStep >= 4 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : multicallStep === 3 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border text-[10px]">
                      3
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Call 3: Configure Inheritance</span>
                    <span className="font-mono text-[10px]">entrypoint: configure_inheritance</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Registers beneficiary {formatShortAddress(beneficiary, 6, 4)} with {dormancyDays} days dormancy.
                  </p>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            {multicallStatus === 'executing' && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Broadcasting atomic multicall transaction to Starknet...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Completed & Beneficiary Share Hub */}
      {step === 5 && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Legacy Protection Configured & Funded!</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Starknet Multicall Executed • NGN On-Ramp Settled
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Policy Details */}
            <div className="rounded-xl border border-border bg-card/60 p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beneficiary:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatShortAddress(beneficiary, 8, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dormancy Threshold:</span>
                <span className="font-bold text-foreground">{dormancyDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Funded Liquidity:</span>
                <span className="font-bold text-emerald-400">${cryptoConversion.vaultFundUsdc} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Starknet Gas Reserve:</span>
                <span className="font-bold text-foreground">{gasReserve} STRK</span>
              </div>
              {starknetTxHash && (
                <div className="flex justify-between items-center border-t border-border/40 pt-2">
                  <span className="text-muted-foreground">Starknet Multicall Tx:</span>
                  <span className="font-mono text-[11px] text-primary">
                    {formatShortAddress(starknetTxHash, 8, 6)}
                  </span>
                </div>
              )}
            </div>

            {/* Beneficiary Claim Portal Share Box */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Beneficiary Claim Link
                </span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  AVNU / CARTRIDGE GASLESS
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide this link to your designated beneficiary. If dormancy triggers, they can
                claim the inheritance gaslessly and off-ramp to their Bolivian bank account via Pollar SEP-24.
              </p>

              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={beneficiaryClaimUrl}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-mono text-muted-foreground truncate select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyClaimLink}
                  className="shrink-0"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button asChild size="sm" className="w-full">
                  <Link to={`/claim?vault=${walletAddress}&beneficiary=${encodeURIComponent(beneficiary.trim())}`}>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Open Beneficiary Claim Portal
                  </Link>
                </Button>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full" size="lg">
              <Link to="/legacy-protection">Return to Legacy Protection Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paystack Popup Modal */}
      <PaystackModal
        isOpen={isPaystackOpen}
        config={{
          email: userEmail,
          amountNgn: ngnAmount,
          onSuccess: handlePaystackSuccess,
          onCancel: () => setIsPaystackOpen(false),
        }}
        onClose={() => setIsPaystackOpen(false)}
      />
    </div>
  );
};
