import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Building,
  Globe,
  Zap,
  CreditCard,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { AssetSymbol } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import {
  formatAssetAmount,
  isValidStarknetAddress,
  NETWORK_FEE,
  SUPPORTED_ASSETS,
} from '../utils/format';
import {
  BushaQuoteResponse,
  BushaPayoutExecutionResult,
  NIGERIAN_BANKS,
  bushaClient,
  BUSHA_RATES,
} from '../lib/busha';
import { buildStellarPaymentPayload, StellarPaymentFormat } from '../lib/stellar-bridge';
import { openRampModal, POLLAR_API_KEY, PollarWithdrawalResult } from '../lib/pollar';
import { PollarRampModal } from '../components/pollar/PollarRampModal';

export const WithdrawPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { vault, withdraw } = useVault();

  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'pollar' ? 'pollar' : tabParam === 'crypto' ? 'crypto' : 'busha';
  const [activeTab, setActiveTab] = useState<'busha' | 'pollar' | 'crypto'>(initialTab);

  const walletAddress = vault?.profile?.wallet_address;

  // --- BUSHA OFF-RAMP STATE ---
  const [bushaAsset, setBushaAsset] = useState<'USDT' | 'USDC'>('USDT');
  const [bushaAmount, setBushaAmount] = useState('500');
  const [selectedBankId, setSelectedBankId] = useState<string>(NIGERIAN_BANKS[1].id); // GTBank
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState('ADEWALE OKONKWO');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [recipientId] = useState('64ae8c26ea1033204c805a8a');
  const [bushaQuote, setBushaQuote] = useState<BushaQuoteResponse | null>(null);
  const [bushaStellarPayload, setBushaStellarPayload] = useState<StellarPaymentFormat | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [isExecutingBusha, setIsExecutingBusha] = useState(false);
  const [bushaResult, setBushaResult] = useState<BushaPayoutExecutionResult | null>(null);
  const [bushaError, setBushaError] = useState('');

  // --- POLLAR OFF-RAMP STATE ---
  const [pollarAmount, setPollarAmount] = useState('250');
  const [pollarResult, setPollarResult] = useState<PollarWithdrawalResult | null>(null);

  // --- CRYPTO TRANSFER STATE ---
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('STRK');
  const [recipient, setRecipient] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoError, setCryptoError] = useState('');
  const [cryptoSuccess, setCryptoSuccess] = useState(false);
  const [cryptoPending, setCryptoPending] = useState(false);

  if (!walletAddress) {
    return (
      <div className="pb-24 md:pb-8">
        <EmptyState
          icon={Wallet}
          title="Wallet not ready"
          description="Finish wallet setup before withdrawing."
          action={
            <Button asChild>
              <Link to="/onboarding/create">Set up wallet</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const selectedBank = NIGERIAN_BANKS.find((b) => b.id === selectedBankId) || NIGERIAN_BANKS[0];
  const usdcBal = vault?.balances.find((b) => b.asset === 'USDC')?.amount ?? 0;
  const currentCryptoBal = vault?.balances.find((b) => b.asset === selectedAsset)?.amount ?? 0;

  // Handle Account Name Lookup
  const handleAccountNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setAccountNumber(clean);
    if (clean.length === 10) {
      setIsVerifyingAccount(true);
      bushaClient
        .resolveAccountName(selectedBank.code, clean)
        .then((name) => {
          setAccountName(name);
          setIsVerifyingAccount(false);
        })
        .catch(() => setIsVerifyingAccount(false));
    } else {
      setAccountName('');
    }
  };

  // 1. Fetch Busha Quote
  const handleGetBushaQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setBushaError('');
    setBushaResult(null);

    const num = parseFloat(bushaAmount);
    if (!num || num <= 0) {
      setBushaError('Please enter a valid amount.');
      return;
    }
    if (accountNumber.length !== 10) {
      setBushaError('Please enter a 10-digit Nigerian NUBAN account number.');
      return;
    }

    setIsGettingQuote(true);
    try {
      // Build Stellar bridge format relay
      const stPayload = buildStellarPaymentPayload({
        sourceAsset: bushaAsset,
        amount: num,
        targetRail: 'BUSHA_NGN',
        beneficiaryIdentifier: accountNumber,
      });
      setBushaStellarPayload(stPayload);

      const ref = `bsh_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const q = await bushaClient.createQuote(
        {
          source_currency: bushaAsset,
          target_currency: 'NGN',
          reference: ref,
          source_amount: bushaAmount,
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
      setBushaQuote(q);
    } catch (err: any) {
      setBushaError(err.message || 'Failed to fetch quote from Busha API.');
    } finally {
      setIsGettingQuote(false);
    }
  };

  // 2. Execute Busha Payout
  const handleExecuteBushaPayout = async () => {
    if (!bushaQuote) return;
    setIsExecutingBusha(true);
    setBushaError('');

    try {
      const res = await bushaClient.executePayout(bushaQuote, {
        bank_name: selectedBank.name,
        account_number: accountNumber,
        account_name: accountName || 'VERIFIED ACCOUNT',
      });

      // Deduct from vault balance
      const parsedNum = parseFloat(bushaQuote.source_amount);
      if (parsedNum > 0) {
        await withdraw({
          asset: 'USDC',
          toAddress: '0x05b6348ef53d9e038848f029b4e654279b940e4f', // Busha Liquidity Contract
          amount: parsedNum,
        });
      }

      setBushaResult(res);
      setBushaQuote(null);
    } catch (err: any) {
      setBushaError(err.message || 'Failed to execute Busha payout.');
    } finally {
      setIsExecutingBusha(false);
    }
  };

  // 3. Trigger Pollar Off-Ramp
  const handleTriggerPollar = () => {
    const num = parseFloat(pollarAmount) || 100;
    const stHash = `stellar_tx_${Math.random().toString(36).substring(2, 12)}`;

    openRampModal({
      apiKey: POLLAR_API_KEY,
      asset: 'USDC',
      amount: num,
      beneficiaryAddress: walletAddress,
      vaultOwnerAddress: walletAddress,
      stellarTxHash: stHash,
      onSuccess: async (res) => {
        setPollarResult(res);
        await withdraw({
          asset: 'USDC',
          toAddress: '0x048e7184ff1049281a8b438290184bfe2410381f', // Pollar Anchor Contract
          amount: num,
        });
      },
    });
  };

  // 4. Crypto transfer
  const handleCryptoWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setCryptoError('');
    setCryptoSuccess(false);

    const parsedAmount = parseFloat(cryptoAmount) || 0;

    if (!isValidStarknetAddress(recipient)) {
      setCryptoError('Please enter a valid Starknet recipient address (0x...).');
      return;
    }

    if (parsedAmount <= 0) {
      setCryptoError('Enter an amount greater than 0.');
      return;
    }

    if (selectedAsset === 'STRK' && parsedAmount + NETWORK_FEE > currentCryptoBal) {
      setCryptoError('Insufficient STRK for withdrawal amount plus network fee.');
      return;
    }

    if (selectedAsset !== 'STRK' && parsedAmount > currentCryptoBal) {
      setCryptoError(`Insufficient ${selectedAsset} balance.`);
      return;
    }

    setCryptoPending(true);
    try {
      await withdraw({
        asset: selectedAsset,
        toAddress: recipient.trim(),
        amount: parsedAmount,
      });
      setCryptoSuccess(true);
      setCryptoAmount('');
      setRecipient('');
    } catch (err: any) {
      setCryptoError(err.message || 'Withdrawal failed.');
    } finally {
      setCryptoPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Withdraw & Local Off-Ramp Hub
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Liquidate vault assets into local bank accounts via Busha & Pollar or transfer on-chain
        </p>
      </div>

      {/* 3-Way Tab Switcher */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('busha');
            setSearchParams({ tab: 'busha' });
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'busha'
              ? 'bg-[#00A859] text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Busha NGN 🇳🇬</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('pollar');
            setSearchParams({ tab: 'pollar' });
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pollar'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Pollar BOB 🇧🇴</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('crypto');
            setSearchParams({ tab: 'crypto' });
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'crypto'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Crypto L2</span>
        </button>
      </div>

      {/* TAB 1: BUSHA OFF-RAMP */}
      {activeTab === 'busha' && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#00A859]" />
                  Busha NGN Bank Off-Ramp
                </CardTitle>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  Endpoint: POST https://api.busha.io/v1/quotes
                </p>
              </div>
              <span className="rounded-full bg-[#00A859]/15 border border-[#00A859]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#00A859]">
                BUSHA PAY-OUT
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instantly convert Starknet USDT or USDC into Nigerian Naira (NGN) deposited into your Nigerian bank account via Busha's automated payout rail.
            </p>

            {/* Payout Success Voucher */}
            {bushaResult && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center space-y-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold text-emerald-400">
                  Bank Payout Confirmed!
                </h3>
                <div className="text-2xl font-black font-display text-foreground">
                  ₦{Number(bushaResult.target_amount).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">NGN</span>
                </div>
                <div className="rounded-xl bg-card border border-border p-3 text-xs font-mono space-y-1.5 text-left mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Payout ID:</span>
                    <span className="font-bold">{bushaResult.payout_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Bank:</span>
                    <span>{bushaResult.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Account:</span>
                    <span>{bushaResult.account_number} ({bushaResult.account_name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Reference:</span>
                    <span>{bushaResult.reference}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quote Form */}
            {!bushaQuote && (
              <form onSubmit={handleGetBushaQuote} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold mb-1">Source Asset</label>
                    <select
                      value={bushaAsset}
                      onChange={(e) => setBushaAsset(e.target.value as any)}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[#00A859] focus:outline-none"
                    >
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold">Amount</label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Vault Bal: ${usdcBal.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="5"
                      value={bushaAmount}
                      onChange={(e) => setBushaAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-mono placeholder:text-muted-foreground focus:ring-2 focus:ring-[#00A859] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Quick amount presets */}
                <div className="flex gap-2">
                  {['100', '250', '500', '1000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBushaAmount(val)}
                      className={`flex-1 rounded-lg border py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                        bushaAmount === val
                          ? 'border-[#00A859] bg-[#00A859]/15 text-[#00A859] font-bold'
                          : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Destination Nigerian Bank</label>
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

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">NUBAN Account Number</label>
                    <span className="text-[10px] text-muted-foreground font-mono">10 digits</span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    placeholder="0123456789"
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-mono tracking-wider focus:ring-2 focus:ring-[#00A859] focus:outline-none"
                    required
                  />
                </div>

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

                {bushaError && <p className="text-xs text-destructive font-medium">{bushaError}</p>}

                <Button
                  type="submit"
                  disabled={isGettingQuote || accountNumber.length !== 10}
                  className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-5 font-bold"
                >
                  {isGettingQuote ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Requesting Quote from Busha...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Get Busha Quote & Rate
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* Quote Confirmation State */}
            {bushaQuote && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#00A859]/40 bg-[#00A859]/5 p-4.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#00A859]/20 pb-2.5">
                    <span className="text-xs text-muted-foreground font-medium">Busha Quote ID</span>
                    <span className="font-mono text-xs font-bold text-[#00A859]">{bushaQuote.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Selling</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {bushaQuote.source_amount} {bushaQuote.source_currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Exchange Rate</span>
                      <span className="font-mono font-semibold text-foreground">
                        1 {bushaQuote.source_currency} = ₦{Number(bushaQuote.rate).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#00A859]/20 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">Payout to Bank:</span>
                      <span className="block text-[10px] text-muted-foreground font-mono">
                        NIP fee: ₦{Number(bushaQuote.fee).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-xl font-extrabold text-[#00A859]">
                        ₦{Number(bushaQuote.target_amount).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground ml-1">NGN</span>
                    </div>
                  </div>
                </div>

                {/* Stellar Format Bridge */}
                {bushaStellarPayload && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-primary font-bold">
                      <span className="flex items-center gap-1.5 font-sans">
                        <Globe className="h-3.5 w-3.5" />
                        Stellar Format Relay (SEP-38)
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Ledger #{bushaStellarPayload.ledgerSequence}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">
                      Hash: {bushaStellarPayload.stellarTxHash}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBushaQuote(null)}
                    className="flex-1 text-xs"
                  >
                    Cancel / Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExecuteBushaPayout}
                    disabled={isExecutingBusha}
                    className="flex-2 bg-[#00A859] hover:bg-[#008f4c] text-white py-5 font-bold"
                  >
                    {isExecutingBusha ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing Transfer...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Confirm & Send NGN to Bank
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: POLLAR BOB OFF-RAMP */}
      {activeTab === 'pollar' && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-500" />
                  Pollar Bolivian Off-Ramp (SEP-24)
                </CardTitle>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  Anchor: anchor.pollar.xyz • Key: {POLLAR_API_KEY.slice(0, 16)}...
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                STELLAR ANCHOR
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Withdraw USDC from your Starknet vault into Bolivian Bolivianos (BOB) deposited into Banco Unión, BNB, BMSC, or BCP accounts.
            </p>

            {pollarResult && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Withdrawal to {pollarResult.bankName} Completed!</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Dispatched:</span>
                  <span className="font-bold text-emerald-400">
                    Bs {pollarResult.amountBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} BOB
                  </span>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold">USDC Amount to Withdraw</label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Vault Balance: ${usdcBal.toFixed(2)} USDC
                </span>
              </div>
              <input
                type="number"
                value={pollarAmount}
                onChange={(e) => setPollarAmount(e.target.value)}
                placeholder="250"
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-muted-foreground font-sans">
                <span>FX Exchange Rate:</span>
                <span className="font-mono text-foreground">1 USD = 8.50 BOB</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-sans">
                <span>Estimated Bolivianos:</span>
                <span className="font-mono font-bold text-emerald-400">
                  Bs {((parseFloat(pollarAmount) || 0) * 8.5).toLocaleString('es-BO', { minimumFractionDigits: 2 })} BOB
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleTriggerPollar}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 font-bold shadow-md"
            >
              <Building className="mr-2 h-4 w-4" />
              Launch Pollar Interactive Off-Ramp (BOB)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: STANDARD CRYPTO TRANSFER */}
      {activeTab === 'crypto' && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Starknet L2 Crypto Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCryptoWithdraw} className="space-y-4">
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
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Destination address
                </label>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x04bf6578a1670929a4a7537b83d16ca1f2113222e43bc09e9929288f3be1890b"
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">Amount</label>
                  <button
                    type="button"
                    onClick={() => {
                      const max =
                        selectedAsset === 'STRK'
                          ? Math.max(0, currentCryptoBal - NETWORK_FEE)
                          : currentCryptoBal;
                      setCryptoAmount(max.toString());
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Use Max
                  </button>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Available: {formatAssetAmount(selectedAsset, currentCryptoBal)} {selectedAsset}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network fee</span>
                  <span className="font-semibold text-foreground">{NETWORK_FEE} STRK</span>
                </div>
              </div>

              {cryptoError && <p className="text-xs text-destructive font-medium">{cryptoError}</p>}
              {cryptoSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Withdrawal submitted and confirmed!
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={cryptoPending || !cryptoAmount || !recipient}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                {cryptoPending ? 'Withdrawing...' : 'Review and withdraw'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pollar Modal for Bolivian withdrawals */}
      <PollarRampModal />
    </div>
  );
};
