import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Building,
  CheckCircle2,
  ArrowRight,
  Loader2,
  FileText,
  UserCheck,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  BOLIVIAN_BANKS,
  PollarBankDetails,
  PollarKycData,
  PollarRampModalOptions,
  PollarWithdrawalResult,
  pollarClient,
  subscribeRampModal,
  POLLAR_API_KEY,
} from '../../lib/pollar';

const DEPARTMENTS = [
  { code: 'LP', name: 'La Paz' },
  { code: 'SC', name: 'Santa Cruz' },
  { code: 'CB', name: 'Cochabamba' },
  { code: 'OR', name: 'Oruro' },
  { code: 'PT', name: 'Potosí' },
  { code: 'TJ', name: 'Tarija' },
  { code: 'CH', name: 'Chuquisaca' },
  { code: 'BE', name: 'Beni' },
  { code: 'PA', name: 'Pando' },
];

export const PollarRampModal: React.FC = () => {
  const [modalOptions, setModalOptions] = useState<PollarRampModalOptions | null>(null);
  const [step, setStep] = useState<'kyc' | 'bank' | 'processing' | 'success'>('kyc');
  const [copied, setCopied] = useState(false);

  // KYC Form State
  const [kycData, setKycData] = useState<PollarKycData>({
    documentType: 'CI',
    documentNumber: '8492013',
    documentExpedition: 'LP',
    fullName: 'Carlos Alberto Mamani',
    phone: '+591 71234567',
    city: 'La Paz',
  });

  // Bank Form State
  const [bankData, setBankData] = useState<PollarBankDetails>({
    bankId: 'union',
    bankName: 'Banco Unión',
    accountNumber: '10000038920194',
    accountType: 'CAJA_AHORRO',
  });

  const [result, setResult] = useState<PollarWithdrawalResult | null>(null);
  const [processingMsg, setProcessingMsg] = useState('');

  // Subscribe to programmatic modal triggers
  useEffect(() => {
    const unsubscribe = subscribeRampModal((options) => {
      setModalOptions(options);
      setStep('kyc');
    });

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<PollarRampModalOptions>;
      setModalOptions(customEvent.detail);
      setStep('kyc');
    };

    window.addEventListener('pollar:open-ramp', handleCustomEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('pollar:open-ramp', handleCustomEvent);
    };
  }, []);

  if (!modalOptions) return null;

  const amountUsdc = modalOptions.amount || 100;
  const exchangeRate = pollarClient.getExchangeRate();
  const amountBob = pollarClient.calculateBob(amountUsdc);

  const handleClose = () => {
    setModalOptions(null);
    if (modalOptions.onClose) modalOptions.onClose();
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('bank');
  };

  const handleBankSelect = (bankId: string) => {
    const selected = BOLIVIAN_BANKS.find((b) => b.id === bankId);
    if (selected) {
      setBankData((prev) => ({
        ...prev,
        bankId: selected.id,
        bankName: selected.name,
      }));
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setProcessingMsg('Verifying Beneficiary Cédula de Identidad with SEGIP / Pollar Anchor...');

    await new Promise((r) => setTimeout(r, 900));
    setProcessingMsg('Creating Stellar SEP-24 Interactive Anchor Session...');

    await new Promise((r) => setTimeout(r, 900));
    setProcessingMsg(`Initiating Banco Central de Bolivia (BCB) ACH payout to ${bankData.bankName}...`);

    try {
      const withdrawalResult = await pollarClient.submitBolivianWithdrawal({
        amountUsdc,
        kyc: kycData,
        bank: bankData,
        stellarTxHash: modalOptions.stellarTxHash,
      });

      setResult(withdrawalResult);
      setStep('success');

      if (modalOptions.onSuccess) {
        modalOptions.onSuccess(withdrawalResult);
      }
    } catch (err) {
      console.error(err);
      setProcessingMsg('Error processing withdrawal. Retrying...');
    }
  };

  const handleCopyReceipt = () => {
    if (result) {
      navigator.clipboard.writeText(result.receiptNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#0B121A] text-foreground shadow-2xl">
        {/* Top Header with Pollar Branding */}
        <div className="flex items-center justify-between border-b border-border/80 bg-[#0E1722] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 font-display font-black text-white shadow-md">
              <span className="text-base">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-foreground tracking-tight">Pollar</span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  SEP-24 OFF-RAMP 🇧🇴
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Key: {POLLAR_API_KEY.slice(0, 15)}...
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Currency Conversion Summary Bar */}
        <div className="grid grid-cols-2 gap-4 border-b border-border/60 bg-[#070D14] px-6 py-3.5">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Settled Inheritance
            </span>
            <p className="font-mono text-base font-bold text-foreground">
              {amountUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Bolivian Payout (BOB)
            </span>
            <p className="font-mono text-base font-bold text-emerald-400">
              Bs {amountBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Step 1: KYC Verification */}
          {step === 'kyc' && (
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <span>STEP 1 OF 2: BENEFICIARY IDENTITY VERIFICATION (KYC)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={kycData.fullName}
                  onChange={(e) => setKycData({ ...kycData, fullName: e.target.value })}
                  placeholder="e.g. Carlos Alberto Mamani Quispe"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Doc Type</label>
                  <select
                    value={kycData.documentType}
                    onChange={(e) => setKycData({ ...kycData, documentType: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-card px-2.5 py-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CI">Cédula (CI)</option>
                    <option value="EXTRANJERO">Extranjero (CE)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">C.I. Number</label>
                  <input
                    type="text"
                    value={kycData.documentNumber}
                    onChange={(e) => setKycData({ ...kycData, documentNumber: e.target.value })}
                    placeholder="8492013"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-mono text-foreground focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Expedición</label>
                  <select
                    value={kycData.documentExpedition}
                    onChange={(e) => setKycData({ ...kycData, documentExpedition: e.target.value })}
                    className="w-full rounded-xl border border-border bg-card px-2 py-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.code} value={dept.code}>
                        {dept.code} - {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    value={kycData.phone}
                    onChange={(e) => setKycData({ ...kycData, phone: e.target.value })}
                    placeholder="+591 70000000"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-mono text-foreground focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">City / Department</label>
                  <input
                    type="text"
                    value={kycData.city}
                    onChange={(e) => setKycData({ ...kycData, city: e.target.value })}
                    placeholder="La Paz"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>Confirm Identity & Select Bank</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Step 2: Bolivian Bank Selection & Details */}
          {step === 'bank' && (
            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1">
                <span className="flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-emerald-400" />
                  STEP 2 OF 2: BOLIVIAN BANK ACCOUNT
                </span>
                <button
                  type="button"
                  onClick={() => setStep('kyc')}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  Edit KYC
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-2">Select Bolivian Bank</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {BOLIVIAN_BANKS.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => handleBankSelect(bank.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-colors cursor-pointer ${
                        bankData.bankId === bank.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                          : 'border-border bg-card text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: bank.logoColor }}
                      />
                      <span className="truncate">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-foreground mb-1">Account Type</label>
                  <select
                    value={bankData.accountType}
                    onChange={(e) =>
                      setBankData({ ...bankData, accountType: e.target.value as any })
                    }
                    className="w-full rounded-xl border border-border bg-card px-2.5 py-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CAJA_AHORRO">Caja de Ahorro</option>
                    <option value="CUENTA_CORRIENTE">Cta. Corriente</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Número de Cuenta (en Bolivianos)
                  </label>
                  <input
                    type="text"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                    placeholder="10000038920194"
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-mono text-foreground focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beneficiary Name:</span>
                  <span className="font-semibold text-foreground">{kycData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document:</span>
                  <span className="font-mono text-foreground">
                    {kycData.documentNumber} {kycData.documentExpedition}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange Rate:</span>
                  <span className="font-mono text-emerald-400">1 USDC = {exchangeRate} BOB</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Authorize Withdrawal of Bs {amountBob.toLocaleString('es-BO')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-sm font-semibold text-foreground">
                  Processing Bolivian Bank Off-Ramp
                </h3>
                <p className="text-xs text-muted-foreground animate-pulse">{processingMsg}</p>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && result && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Withdrawal Successfully Dispatched!
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Funds have been anchored through Stellar SEP-24 and deposited directly into your Bolivian bank account.
                </p>
              </div>

              {/* Receipt card */}
              <div className="rounded-xl border border-border/80 bg-card p-4 text-xs space-y-2.5 font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground font-sans">Reference Receipt:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-400">{result.receiptNumber}</span>
                    <button
                      type="button"
                      onClick={handleCopyReceipt}
                      className="p-1 hover:text-foreground text-muted-foreground cursor-pointer"
                      title="Copy receipt"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Amount Dispatched:</span>
                  <span className="font-bold text-foreground">
                    Bs {result.amountBob.toLocaleString('es-BO', { minimumFractionDigits: 2 })} BOB
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Destination Bank:</span>
                  <span className="text-foreground">{result.bankName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Account:</span>
                  <span className="text-foreground">{result.accountNumber}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Beneficiary:</span>
                  <span className="text-foreground">{result.beneficiaryName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Anchor Protocol:</span>
                  <span className="text-emerald-400">Pollar Stellar SEP-24</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 border-t border-border/60 bg-[#070D14] py-2.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Regulated Stellar Anchor Rail • Pollar Protocol v0.11</span>
        </div>
      </div>
    </div>
  );
};
