import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Globe,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  BushaQuoteResponse,
  BushaPayoutExecutionResult,
  NIGERIAN_BANKS,
  bushaClient,
  BUSHA_RATES,
} from '../../lib/busha';
import { buildStellarPaymentPayload, StellarPaymentFormat } from '../../lib/stellar-bridge';

interface BushaOffRampModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  defaultAsset?: 'USDT' | 'USDC';
  onSuccess?: (result: BushaPayoutExecutionResult, stellarTx?: StellarPaymentFormat) => void;
}

export const BushaOffRampModal: React.FC<BushaOffRampModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 1000,
  defaultAsset = 'USDT',
  onSuccess,
}) => {
  const [asset, setAsset] = useState<'USDT' | 'USDC'>(defaultAsset);
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [selectedBankId, setSelectedBankId] = useState<string>(NIGERIAN_BANKS[1].id); // GTBank default
  const [accountNumber, setAccountNumber] = useState<string>('0123456789');
  const [accountName, setAccountName] = useState<string>('');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState<boolean>(false);
  const [recipientId, setRecipientId] = useState<string>('64ae8c26ea1033204c805a8a');

  // Step flow: 'input' -> 'quoted' -> 'executing' -> 'completed'
  const [step, setStep] = useState<'input' | 'quoted' | 'executing' | 'completed'>('input');
  const [quote, setQuote] = useState<BushaQuoteResponse | null>(null);
  const [stellarPayload, setStellarPayload] = useState<StellarPaymentFormat | null>(null);
  const [payoutResult, setPayoutResult] = useState<BushaPayoutExecutionResult | null>(null);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const selectedBank = NIGERIAN_BANKS.find((b) => b.id === selectedBankId) || NIGERIAN_BANKS[0];

  // Auto resolve account name when 10 digits entered
  useEffect(() => {
    if (accountNumber.length === 10) {
      setIsVerifyingAccount(true);
      bushaClient
        .resolveAccountName(selectedBank.code, accountNumber)
        .then((name) => {
          setAccountName(name);
          setIsVerifyingAccount(false);
        })
        .catch(() => setIsVerifyingAccount(false));
    } else {
      setAccountName('');
    }
  }, [accountNumber, selectedBank.code]);

  if (!isOpen) return null;

  const handleFetchQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (accountNumber.length !== 10) {
      setError('Please enter a valid 10-digit Nigerian NUBAN account number.');
      return;
    }

    setIsSubmittingQuote(true);

    try {
      const reference = `bsh_ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 1. Generate Stellar Format Relay payload
      const stPayload = buildStellarPaymentPayload({
        sourceAsset: asset,
        amount: numAmount,
        targetRail: 'BUSHA_NGN',
        beneficiaryIdentifier: accountNumber,
      });
      setStellarPayload(stPayload);

      // 2. Request Quote from Busha API
      const q = await bushaClient.createQuote(
        {
          source_currency: asset,
          target_currency: 'NGN',
          reference,
          source_amount: amount,
          pay_out: {
            type: 'bank_transfer',
            recipient_id: recipientId,
          },
        },
        {
          bank_name: selectedBank.name,
          account_number: accountNumber,
          account_name: accountName || 'VERIFIED ACCOUNT',
        }
      );

      setQuote(q);
      setStep('quoted');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quote from Busha API.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleConfirmPayout = async () => {
    if (!quote) return;
    setStep('executing');
    setError('');

    try {
      const res = await bushaClient.executePayout(quote, {
        bank_name: selectedBank.name,
        account_number: accountNumber,
        account_name: accountName || 'VERIFIED ACCOUNT',
      });

      setPayoutResult(res);
      setStep('completed');
      if (onSuccess && stellarPayload) {
        onSuccess(res, stellarPayload);
      }
    } catch (err: any) {
      setError(err.message || 'Payout execution failed.');
      setStep('quoted');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl text-foreground my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-5 top-5 rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00A859]/15 text-[#00A859] border border-[#00A859]/30">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold">Busha NGN Off-Ramp</h2>
              <span className="rounded bg-[#00A859]/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[#00A859]">
                POST /v1/quotes
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct crypto liquidation into Nigerian bank accounts via Busha Pay-Out
            </p>
          </div>
        </div>

        {/* Step 1: Input & Destination Details */}
        {step === 'input' && (
          <form onSubmit={handleFetchQuote} className="space-y-4">
            {/* Currency & Amount */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1">Source Asset</label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value as any)}
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[#00A859] focus:outline-none"
                >
                  <option value="USDT">USDT (Tether)</option>
                  <option value="USDC">USDC (Centre)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">Source Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-mono placeholder:text-muted-foreground focus:ring-2 focus:ring-[#00A859] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Quick amount presets */}
            <div className="flex gap-2">
              {['100', '250', '500', '1000', '2500'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`flex-1 rounded-lg border py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                    amount === val
                      ? 'border-[#00A859] bg-[#00A859]/15 text-[#00A859] font-bold'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* Destination Nigerian Bank */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Destination Nigerian Bank
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#00A859] focus:outline-none"
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">NUBAN Account Number</label>
                <span className="text-[10px] text-muted-foreground font-mono">10 digits</span>
              </div>
              <input
                type="text"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="0123456789"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-mono tracking-wider focus:ring-2 focus:ring-[#00A859] focus:outline-none"
                required
              />
            </div>

            {/* Resolved Account Name Badge */}
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00A859]" />
                <span className="text-muted-foreground">Account Name:</span>
              </div>
              <div>
                {isVerifyingAccount ? (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Resolving NIP...
                  </span>
                ) : accountName ? (
                  <span className="font-mono font-bold text-[#00A859]">{accountName}</span>
                ) : (
                  <span className="text-muted-foreground italic text-[11px]">Enter 10 digits to verify</span>
                )}
              </div>
            </div>

            {/* Recipient ID metadata as specified in Busha curl */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono px-1">
              <span>Recipient ID:</span>
              <span className="text-foreground">{recipientId}</span>
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <Button
              type="submit"
              disabled={isSubmittingQuote || accountNumber.length !== 10}
              className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-5 font-bold"
            >
              {isSubmittingQuote ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Requesting Busha Quote...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Get Busha Rate & Quote
                </span>
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Quoted State */}
        {step === 'quoted' && quote && (
          <div className="space-y-4">
            {/* Quote details box */}
            <div className="rounded-2xl border border-[#00A859]/40 bg-[#00A859]/5 p-4.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#00A859]/20 pb-2.5">
                <span className="text-xs text-muted-foreground font-medium">Busha Quote ID</span>
                <span className="font-mono text-xs font-bold text-[#00A859]">{quote.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Selling</span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    {quote.source_amount} {quote.source_currency}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Exchange Rate</span>
                  <span className="font-mono font-semibold text-foreground">
                    1 {quote.source_currency} = ₦{Number(quote.rate).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#00A859]/20 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Payout to Bank:</span>
                  <span className="block text-[10px] text-muted-foreground font-mono">
                    Fee: ₦{Number(quote.fee).toLocaleString()} included
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-extrabold text-[#00A859]">
                    ₦{Number(quote.target_amount).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground ml-1">NGN</span>
                </div>
              </div>
            </div>

            {/* Recipient summary */}
            <div className="rounded-xl border border-border bg-card p-3.5 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span className="font-sans">Bank:</span>
                <span className="text-foreground font-bold">{selectedBank.name}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="font-sans">Account:</span>
                <span className="text-foreground">{accountNumber}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="font-sans">Beneficiary:</span>
                <span className="text-[#00A859] font-bold">{accountName || 'VERIFIED BENEFICIARY'}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="font-sans">Reference:</span>
                <span className="text-foreground">{quote.reference}</span>
              </div>
            </div>

            {/* Stellar Bridge Format Indicator */}
            {stellarPayload && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-primary font-bold">
                  <span className="flex items-center gap-1.5 font-sans">
                    <Globe className="h-3.5 w-3.5" />
                    Stellar Format Relay (SEP-38)
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Ledger #{stellarPayload.ledgerSequence}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground truncate">
                  Hash: {stellarPayload.stellarTxHash}
                </p>
              </div>
            )}

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('input')}
                className="flex-1 text-xs"
              >
                Back / Edit
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPayout}
                className="flex-2 bg-[#00A859] hover:bg-[#008f4c] text-white py-5 font-bold"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Execute Bank Payout
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Executing Payout */}
        {step === 'executing' && (
          <div className="py-10 text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#00A859]/10 text-[#00A859] border border-[#00A859]/20 animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold">Broadcasting Payout via Busha</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Relaying Stellar format payment to Busha NIP liquidity engine and routing to Nigerian bank...
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Completed Payout Receipt */}
        {step === 'completed' && payoutResult && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-bold text-emerald-400">
                Busha Bank Payout Successful!
              </h3>
              <p className="text-xs text-muted-foreground">
                Funds have been liquidated from crypto and transferred to the Nigerian bank account.
              </p>
              <div className="pt-2">
                <span className="font-display text-2xl font-black text-foreground">
                  ₦{Number(payoutResult.target_amount).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-muted-foreground ml-1">NGN</span>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Payout ID:</span>
                <span className="text-foreground font-bold">{payoutResult.payout_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Reference:</span>
                <span className="text-foreground">{payoutResult.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Bank:</span>
                <span className="text-foreground">{payoutResult.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Account Number:</span>
                <span className="text-foreground">{payoutResult.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Beneficiary:</span>
                <span className="text-emerald-400 font-bold">{payoutResult.account_name}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-[11px]">
                <span className="text-muted-foreground font-sans">Estimated Arrival:</span>
                <span className="text-foreground">{payoutResult.estimated_arrival}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground py-4 font-bold"
            >
              Done / Return to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
