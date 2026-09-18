import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Shield,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Building,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Globe,
  CreditCard,
  Database,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatShortAddress } from '../utils/format';
import { openRampModal, POLLAR_API_KEY, PollarWithdrawalResult } from '../lib/pollar';
import { PollarRampModal } from '../components/pollar/PollarRampModal';
import { useVault } from '../context/VaultContext';
import { BushaOffRampModal } from '../components/busha/BushaOffRampModal';
import { BushaPayoutExecutionResult, BUSHA_RATES } from '../lib/busha';
import { StellarPaymentFormat } from '../lib/stellar-bridge';
import { RemittanceRecord, ClaimStatusResponse, ClaimPipelineStep } from '../types';

type ClaimPhase =
  | 'idle'
  | 'STARKNET_CLAIMED'
  | 'STELLAR_SUBMITTED'
  | 'STELLAR_CONFIRMED'
  | 'OFFRAMP_COMPLETED';

export const BeneficiaryClaimPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { vault } = useVault();

  // Query parameters or defaults
  const initialVault =
    searchParams.get('vault') ||
    vault?.profile?.wallet_address ||
    '0x07b7194ffba17045b78b5ce534346e01a88dbce04c632876615b138ff40c4a45';
  const initialBeneficiary =
    searchParams.get('beneficiary') ||
    vault?.legacy?.next_of_kin ||
    'STELLAR_USER_BOLIVIA_01';

  const [vaultAddress] = useState(initialVault);
  const [beneficiaryId] = useState(initialBeneficiary);

  // Vault mock/live metrics
  const inheritanceAmountUsdc = 1250.0;
  const gasReserveStrk = vault?.legacy?.gas_reserve || 0.05;
  const dormancyDays = vault?.legacy?.dormancy_days || 180;

  // Selected off-ramp rail: 'busha_ngn' (Nigeria) or 'pollar_bob' (Bolivia)
  const [payoutRail, setPayoutRail] = useState<'busha_ngn' | 'pollar_bob'>('busha_ngn');

  // Claim & Polling State
  const [phase, setPhase] = useState<ClaimPhase>('idle');
  const [pollingActive, setPollingActive] = useState(false);
  const [starknetTxHash, setStarknetTxHash] = useState('');
  const [stellarTxHash, setStellarTxHash] = useState('');
  const [sep24Id, setSep24Id] = useState('');
  const [remittance, setRemittance] = useState<RemittanceRecord | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<ClaimPipelineStep[]>([]);
  const [pollarWithdrawal, setPollarWithdrawal] = useState<PollarWithdrawalResult | null>(null);
  const [bushaPayout, setBushaPayout] = useState<BushaPayoutExecutionResult | null>(null);
  const [isBushaModalOpen, setIsBushaModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [backendConnected, setBackendConnected] = useState(true);

  // Track if off-ramp modal already opened for this confirmation
  const offrampTriggeredRef = useRef(false);

  // Poll status endpoint GET /api/vault/:address/claim-status
  const pollClaimStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/vault/${encodeURIComponent(vaultAddress)}/claim-status`);
      if (!res.ok) {
        setBackendConnected(false);
        return null;
      }
      setBackendConnected(true);
      const data: ClaimStatusResponse = await res.json();

      if (data.status === 'success' && data.remittance) {
        const rem = data.remittance;
        setRemittance(rem);

        if (data.steps) {
          setPipelineSteps(data.steps);
        }

        if (rem.starknet_tx_hash) {
          setStarknetTxHash(rem.starknet_tx_hash);
        }
        if (rem.stellar_tx_hash) {
          setStellarTxHash(rem.stellar_tx_hash);
        }
        if (rem.sep24_id) {
          setSep24Id(rem.sep24_id);
        }

        // Map DB state to UI phase
        if (rem.state === 'STARKNET_CLAIMED') {
          setPhase('STARKNET_CLAIMED');
        } else if (rem.state === 'STELLAR_SUBMITTED') {
          setPhase('STELLAR_SUBMITTED');
        } else if (rem.state === 'STELLAR_CONFIRMED') {
          setPhase((prev) => (prev === 'OFFRAMP_COMPLETED' ? prev : 'STELLAR_CONFIRMED'));
        } else if (rem.state === 'COMPLETED') {
          setPhase('OFFRAMP_COMPLETED');
          setPollingActive(false);
        }

        return rem;
      }
    } catch (err) {
      console.warn('[Beneficiary Portal] Status polling error:', err);
      setBackendConnected(false);
    }
    return null;
  }, [vaultAddress]);

  // Initial check on mount
  useEffect(() => {
    pollClaimStatus();
  }, [pollClaimStatus]);

  // Active polling loop while claim is in progress
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pollingActive && phase !== 'OFFRAMP_COMPLETED') {
      timer = setInterval(async () => {
        setElapsedSeconds((prev) => prev + 1);
        const rem = await pollClaimStatus();

        if (rem && rem.state === 'STELLAR_CONFIRMED' && !offrampTriggeredRef.current) {
          offrampTriggeredRef.current = true;
          // Automatically launch off-ramp modal
          if (payoutRail === 'busha_ngn') {
            console.info('[Beneficiary Portal] STELLAR_CONFIRMED reached. Automatically launching Busha NGN Off-Ramp...');
            setTimeout(() => {
              setIsBushaModalOpen(true);
            }, 600);
          } else {
            console.info('[Beneficiary Portal] STELLAR_CONFIRMED reached. Automatically triggering openRampModal() with Pollar SDK...');
            setTimeout(() => {
              openRampModal({
                apiKey: POLLAR_API_KEY,
                asset: 'USDC',
                amount: rem.amount_usdc || inheritanceAmountUsdc,
                beneficiaryAddress: beneficiaryId,
                vaultOwnerAddress: vaultAddress,
                stellarTxHash: rem.stellar_tx_hash || 'stellar_tx_testnet',
                onSuccess: async (res) => {
                  setPollarWithdrawal(res);
                  setPhase('OFFRAMP_COMPLETED');
                  setPollingActive(false);

                  // Update DB record to COMPLETED
                  await fetch(`/api/remittances/${rem.remittance_id}/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sep24_id: rem.sep24_id,
                      payout_details: res,
                    }),
                  });
                },
              });
            }, 600);
          }
        }
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [pollingActive, phase, pollClaimStatus, payoutRail, beneficiaryId, vaultAddress, inheritanceAmountUsdc]);

  // Handle Gasless Claim Trigger via Backend API
  const handleTriggerGaslessClaim = async () => {
    setPollingActive(true);
    setElapsedSeconds(0);
    offrampTriggeredRef.current = false;
    setPhase('STARKNET_CLAIMED');

    try {
      // Dispatch claim to backend bridging engine
      const res = await fetch(`/api/vault/${encodeURIComponent(vaultAddress)}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiary_identifier: beneficiaryId,
          amount_usdc: inheritanceAmountUsdc,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.remittance) {
          setRemittance(data.remittance);
          if (data.remittance.starknet_tx_hash) {
            setStarknetTxHash(data.remittance.starknet_tx_hash);
          }
        }
      }
    } catch (err) {
      console.warn('[Beneficiary Portal] Trigger claim API error, polling will continue:', err);
    }
  };

  const handleManualOpenPollar = () => {
    openRampModal({
      apiKey: POLLAR_API_KEY,
      asset: 'USDC',
      amount: inheritanceAmountUsdc,
      beneficiaryAddress: beneficiaryId,
      vaultOwnerAddress: vaultAddress,
      stellarTxHash: stellarTxHash || `stellar_tx_${Date.now()}`,
      onSuccess: async (res) => {
        setPollarWithdrawal(res);
        setPhase('OFFRAMP_COMPLETED');
        setPollingActive(false);

        if (remittance) {
          await fetch(`/api/remittances/${remittance.remittance_id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sep24_id: remittance.sep24_id,
              payout_details: res,
            }),
          });
        }
      },
    });
  };

  const handleBushaSuccess = async (res: BushaPayoutExecutionResult) => {
    setBushaPayout(res);
    setPhase('OFFRAMP_COMPLETED');
    setPollingActive(false);
    setIsBushaModalOpen(false);

    if (remittance) {
      await fetch(`/api/remittances/${remittance.remittance_id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sep24_id: res.reference,
          payout_details: res,
        }),
      });
    }
  };

  const handleCopyStarknetTx = () => {
    if (starknetTxHash) {
      navigator.clipboard.writeText(starknetTxHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
              BENEFICIARY CLAIM PORTAL
            </span>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary">
              AA Paymaster Ready
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Decentralized Inheritance Claim
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Starknet L2 gasless contract execution with Stellar format conversion to Busha (NGN) & Pollar (BOB).
          </p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>

      {/* Vault Status Banner */}
      <div className="vault-surface rounded-3xl p-6 sm:p-7 shadow-xl border border-vault/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-vault-foreground/70">
              Eligible Inheritance Liquidity
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl sm:text-4xl font-black text-accent">
                ${inheritanceAmountUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-bold text-vault-foreground/80">USDC</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-vault-foreground/80 font-mono">
              <span className="flex items-center gap-1">
                🇳🇬 <strong>₦{(inheritanceAmountUsdc * BUSHA_RATES.USDC_TO_NGN).toLocaleString()} NGN</strong> via Busha
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                🇧🇴 <strong>Bs {(inheritanceAmountUsdc * 8.5).toLocaleString('es-BO')} BOB</strong> via Pollar
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              DORMANCY ELIGIBILITY CONFIRMED
            </span>
            <span className="text-[11px] text-vault-foreground/60">
              Threshold: {dormancyDays} days inactivity passed
            </span>
          </div>
        </div>

        {/* Vault metadata details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-vault/20 text-xs font-mono">
          <div className="bg-black/20 rounded-xl p-3">
            <span className="text-vault-foreground/60 block font-sans text-[11px] mb-0.5">
              Vault Owner Account:
            </span>
            <span className="text-vault-foreground font-semibold break-all">
              {formatShortAddress(vaultAddress, 10, 8)}
            </span>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <span className="text-vault-foreground/60 block font-sans text-[11px] mb-0.5">
              Designated Beneficiary:
            </span>
            <span className="text-accent font-semibold break-all">
              {formatShortAddress(beneficiaryId, 10, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* Account Abstraction Paymaster Trigger Card */}
      {phase === 'idle' && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Select Payout Rail & Execute Claim
              </CardTitle>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                AVNU / Cartridge AA
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Preferred Local Currency Off-Ramp Selection */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Choose Local Payout Currency:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Busha NGN */}
                <button
                  type="button"
                  onClick={() => setPayoutRail('busha_ngn')}
                  className={`flex flex-col text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                    payoutRail === 'busha_ngn'
                      ? 'border-[#00A859] bg-[#00A859]/10 shadow-md ring-1 ring-[#00A859]'
                      : 'border-border bg-card hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-[#00A859]" />
                      Busha NGN Off-Ramp 🇳🇬
                    </span>
                    <span className="rounded bg-[#00A859]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#00A859]">
                      NAIRA (NGN)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Instant bank transfer to Access, GTB, Zenith, Kuda, or any Nigerian bank via Busha API.
                  </p>
                  <div className="mt-3 pt-2 border-t border-border flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-bold text-[#00A859]">
                      ₦{(inheritanceAmountUsdc * BUSHA_RATES.USDC_TO_NGN).toLocaleString()} NGN
                    </span>
                  </div>
                </button>

                {/* Option 2: Pollar BOB */}
                <button
                  type="button"
                  onClick={() => setPayoutRail('pollar_bob')}
                  className={`flex flex-col text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                    payoutRail === 'pollar_bob'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500'
                      : 'border-border bg-card hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-emerald-400" />
                      Pollar BOB Off-Ramp 🇧🇴
                    </span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                      BOLIVIANOS (BOB)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Direct transfer to Banco Unión, BNB, BMSC, or BCP accounts in Bolivia via Pollar SEP-24.
                  </p>
                  <div className="mt-3 pt-2 border-t border-border flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-bold text-emerald-400">
                      Bs {(inheritanceAmountUsdc * 8.5).toLocaleString('es-BO')} BOB
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-xs space-y-2 leading-relaxed">
              <p className="text-foreground font-medium">
                As the designated beneficiary, you do not need gas or tokens in your wallet to claim this inheritance.
              </p>
              <p className="text-muted-foreground">
                Transaction gas is sponsored by the Account Abstraction Paymaster using the vault's pre-funded gas reserve ({gasReserveStrk} STRK). Funds will automatically be bridged into Stellar format for conversion to your chosen local currency.
              </p>
            </div>

            <Button
              className="w-full bg-[#AAFF00] text-[#0B0F14] hover:bg-[#9CE600] font-bold py-6 text-base shadow-lg shadow-[#AAFF00]/15"
              size="lg"
              onClick={handleTriggerGaslessClaim}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Claim Inheritance ($0.00 Gasless with Paymaster)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Live Polling Screen with State Transitions */}
      {phase !== 'idle' && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${pollingActive ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                Cross-Chain Execution Pipeline
              </CardTitle>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-muted-foreground">Elapsed:</span>
                <span className="font-bold text-foreground">{elapsedSeconds}s</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 3-State Progress Pipeline */}
            <div className="space-y-3">
              {/* Transition 1: STARKNET_CLAIMED */}
              <div
                className={`flex items-start gap-3.5 rounded-xl border p-4 text-xs transition-all ${
                  phase === 'STARKNET_CLAIMED'
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-emerald-500/40 bg-emerald-500/10'
                }`}
              >
                <div className="mt-0.5">
                  {phase === 'STARKNET_CLAIMED' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">
                      STARKNET_CLAIMED
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                      AVNU Paymaster Sponsored
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Cairo inheritance contract executed. Vault funds unlocked and transferred into cross-chain escrow.
                  </p>
                  {starknetTxHash && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-primary pt-1">
                      <span>Tx: {formatShortAddress(starknetTxHash, 10, 8)}</span>
                      <button
                        type="button"
                        onClick={handleCopyStarknetTx}
                        className="p-1 hover:text-foreground text-muted-foreground cursor-pointer"
                        title="Copy Tx Hash"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Transition 2: STELLAR_SUBMITTED */}
              <div
                className={`flex items-start gap-3.5 rounded-xl border p-4 text-xs transition-all ${
                  phase === 'STARKNET_CLAIMED'
                    ? 'border-border bg-card/50 opacity-60'
                    : phase === 'STELLAR_SUBMITTED'
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-emerald-500/40 bg-emerald-500/10'
                }`}
              >
                <div className="mt-0.5">
                  {phase === 'STARKNET_CLAIMED' ? (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  ) : phase === 'STELLAR_SUBMITTED' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">
                      STELLAR_SUBMITTED
                    </span>
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300">
                      SEP-24 / SEP-38 Relay
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Cross-chain relayer accepted Starknet proof. Stellar Testnet minting & escrow transaction envelope generated.
                  </p>
                  {stellarTxHash && (
                    <div className="font-mono text-[11px] text-blue-400 pt-1">
                      Stellar Tx: {stellarTxHash}
                    </div>
                  )}
                </div>
              </div>

              {/* Transition 3: STELLAR_CONFIRMED */}
              <div
                className={`flex items-start gap-3.5 rounded-xl border p-4 text-xs transition-all ${
                  phase === 'STARKNET_CLAIMED' || phase === 'STELLAR_SUBMITTED'
                    ? 'border-border bg-card/50 opacity-60'
                    : 'border-emerald-500/50 bg-emerald-500/10'
                }`}
              >
                <div className="mt-0.5">
                  {phase === 'STELLAR_CONFIRMED' || phase === 'OFFRAMP_COMPLETED' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">
                      STELLAR_CONFIRMED
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                      Ledger Consensus Finalized
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Stellar ledger consensus confirmed. Escrow liquidity ready for payout dispatch into local bank accounts!
                  </p>
                  {stellarTxHash && (
                    <div className="font-mono text-[11px] text-emerald-400 pt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="font-sans font-medium text-foreground">Stellar Hash:</span>
                      <span className="break-all">{stellarTxHash}</span>
                    </div>
                  )}
                  {sep24Id && (
                    <div className="font-mono text-[11px] text-muted-foreground pt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-sans font-medium text-foreground">SEP-24 Anchor ID:</span>
                      <span className="text-accent break-all">{sep24Id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Remittance Record Inspection Card */}
            {remittance && (
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between font-sans border-b border-border/50 pb-2">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-primary" />
                    Indexed Remittance Record
                  </span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {remittance.state}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block font-sans">Remittance ID:</span>
                    <span className="text-foreground font-semibold">{remittance.remittance_id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-sans">Target Rail:</span>
                    <span className="text-foreground font-semibold">{remittance.target_network} Testnet (USDC)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-sans">Beneficiary Stellar Wallet:</span>
                    <span className="text-foreground break-all">{formatShortAddress(remittance.stellar_beneficiary_address || '', 10, 8)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-sans">Timestamp:</span>
                    <span className="text-foreground">{new Date(remittance.updated_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons for Off-Ramp Gateways */}
            {(phase === 'STELLAR_CONFIRMED' || phase === 'OFFRAMP_COMPLETED') && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Busha NGN Trigger */}
                  <div className="rounded-2xl border border-[#00A859]/30 bg-[#00A859]/5 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#00A859] flex items-center gap-1.5">
                          <Building className="h-4 w-4" />
                          Busha NGN Off-Ramp 🇳🇬
                        </span>
                        <span className="text-[10px] font-mono text-[#00A859] font-bold">1 USD = ₦1,530</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Withdraw directly to GTB, Access, Kuda, Zenith, or any Nigerian bank account.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsBushaModalOpen(true)}
                      className="mt-3 w-full bg-[#00A859] hover:bg-[#008f4c] text-white font-bold py-2.5 text-xs shadow-md"
                    >
                      <Building className="mr-1.5 h-3.5 w-3.5" />
                      Open Busha NGN Off-Ramp
                    </Button>
                  </div>

                  {/* Pollar BOB Trigger */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Globe className="h-4 w-4" />
                          Pollar BOB Off-Ramp 🇧🇴
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">1 USD = 8.50 BOB</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Withdraw directly to Banco Unión, BNB, BMSC, or BCP in Bolivia with KYC.
                      </p>
                    </div>
                    <Button
                      onClick={handleManualOpenPollar}
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 text-xs shadow-md"
                    >
                      <Globe className="mr-1.5 h-3.5 w-3.5" />
                      Open Pollar BOB Off-Ramp
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* If Busha payout completed */}
            {phase === 'OFFRAMP_COMPLETED' && bushaPayout && (
              <div className="rounded-2xl border border-[#00A859]/40 bg-card p-5 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#00A859] font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Withdrawal Successfully Dispatched to Nigerian Bank via Busha!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="bg-muted/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Bank</span>
                    <span className="font-bold text-foreground">{bushaPayout.bank_name}</span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Account Number</span>
                    <span className="font-bold text-foreground">{bushaPayout.account_number}</span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Payout Dispatched (NGN)</span>
                    <span className="font-bold text-[#00A859]">
                      ₦{Number(bushaPayout.target_amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Busha Reference</span>
                    <span className="font-bold text-foreground">{bushaPayout.reference}</span>
                  </div>
                </div>
              </div>
            )}

            {/* If Pollar off-ramp completed */}
            {phase === 'OFFRAMP_COMPLETED' && pollarWithdrawal && (
              <div className="rounded-2xl border border-emerald-500/40 bg-card p-5 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Withdrawal Successfully Dispatched to Bolivian Bank!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="bg-muted/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Bank</span>
                    <span className="font-bold text-foreground">{pollarWithdrawal.bankName}</span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Account</span>
                    <span className="font-bold text-foreground">{pollarWithdrawal.accountNumber}</span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Dispatched (BOB)</span>
                    <span className="font-bold text-emerald-400">
                      Bs {pollarWithdrawal.amountBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[10px]">Receipt Voucher</span>
                    <span className="font-bold text-foreground">{pollarWithdrawal.receiptNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Global Modals */}
      <PollarRampModal />
      <BushaOffRampModal
        isOpen={isBushaModalOpen}
        onClose={() => setIsBushaModalOpen(false)}
        defaultAmount={inheritanceAmountUsdc}
        defaultAsset="USDC"
        onSuccess={handleBushaSuccess}
      />
    </div>
  );
};
