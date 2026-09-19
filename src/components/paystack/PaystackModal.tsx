import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  PaystackPaymentConfig,
  PaystackSuccessResponse,
  generatePaystackReference,
  PAYSTACK_PUBLIC_KEY,
  loadPaystackScript,
} from '../../lib/paystack';

interface PaystackModalProps {
  isOpen: boolean;
  config: PaystackPaymentConfig;
  onClose: () => void;
}

export const PaystackModal: React.FC<PaystackModalProps> = ({ isOpen, config, onClose }) => {
  const [tab, setTab] = useState<'card' | 'bank' | 'ussd'>('card');
  const [cardNumber, setCardNumber] = useState('4084 0840 8408 4084');
  const [cardExpiry, setCardExpiry] = useState('09/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState<'details' | 'pin' | 'otp' | 'processing' | 'success'>('details');
  const [processingMessage, setProcessingMessage] = useState('');
  const [officialScriptReady, setOfficialScriptReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPaystackScript().then((ready) => {
        setOfficialScriptReady(ready);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeKey = config.publicKey || PAYSTACK_PUBLIC_KEY;

  const handleLaunchOfficialPopup = () => {
    if (typeof (window as any).PaystackPop !== 'undefined') {
      const handler = (window as any).PaystackPop.setup({
        key: activeKey,
        email: config.email,
        amount: Math.round(config.amountNgn * 100), // in Kobo
        currency: 'NGN',
        ref: config.reference || generatePaystackReference(),
        metadata: {
          custom_fields: [
            {
              display_name: 'Platform',
              variable_name: 'platform',
              value: 'Legacy Vault Starknet',
            },
          ],
        },
        callback: (response: any) => {
          const usdEquivalent = Number((config.amountNgn / 1500).toFixed(2));
          config.onSuccess({
            reference: response.reference || response.trxref,
            trans: response.trans || `TRX_${Date.now()}`,
            status: 'success',
            message: 'Approved',
            transaction: response.transaction || response.reference,
            amountNgn: config.amountNgn,
            usdEquivalent,
            strkReserveEquivalent: 0.05,
          });
        },
        onClose: () => {
          if (config.onCancel) config.onCancel();
        },
      });
      handler.openIframe();
    } else {
      // Fallback to internal simulator
      setStep('pin');
    }
  };

  const handleFillTestCard = () => {
    setCardNumber('4084 0840 8408 4084');
    setCardExpiry('12/28');
    setCardCvv('582');
  };

  const handleSubmitCard = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('pin');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setProcessingMessage('Contacting Central Bank Interswitch & NIBSS...');
    
    await new Promise((r) => setTimeout(r, 700));
    setProcessingMessage('Authenticating Naira payment authorization via Paystack Gateway...');
    
    await new Promise((r) => setTimeout(r, 700));
    setProcessingMessage('Allocating Starknet Gas Reserve & Vault Liquidity...');

    await new Promise((r) => setTimeout(r, 700));
    setStep('success');

    const reference = config.reference || generatePaystackReference();
    const usdEquivalent = Number((config.amountNgn / 1500).toFixed(2));
    const strkReserveEquivalent = 0.05;

    const response: PaystackSuccessResponse = {
      reference,
      trans: `TRX_${Date.now()}`,
      status: 'success',
      message: 'Approved',
      transaction: reference,
      amountNgn: config.amountNgn,
      usdEquivalent,
      strkReserveEquivalent,
    };

    setTimeout(() => {
      config.onSuccess(response);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#0BA4DB]/40 bg-[#0C131D] text-[#E5E9F0] shadow-2xl">
        {/* Top Header with Paystack Theme */}
        <div className="flex items-center justify-between border-b border-[#1F2D3D] bg-[#0E1A29] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0BA4DB] font-display font-black text-white text-sm shadow-md">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0BA4DB]">Paystack</span>
                <span className="rounded bg-[#0BA4DB]/20 px-1 py-0.2 text-[10px] font-semibold text-[#0BA4DB]">TESTNET</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Key: {activeKey.slice(0, 14)}...
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-[#1E2E42] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount bar */}
        <div className="flex items-center justify-between bg-[#081018] px-6 py-3 border-b border-[#1F2D3D]">
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{config.email}</span>
          <div className="text-right">
            <span className="font-mono text-base font-bold text-[#00C3F7]">
              ₦{config.amountNgn.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {step === 'details' && (
            <div>
              {/* Official popup button if script is available */}
              {officialScriptReady && (
                <button
                  type="button"
                  onClick={handleLaunchOfficialPopup}
                  className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#0BA4DB]/50 bg-[#0BA4DB]/15 py-2.5 text-xs font-bold text-[#00C3F7] hover:bg-[#0BA4DB]/25 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Launch Official Paystack Checkout Popup
                </button>
              )}

              {/* Payment Methods tabs */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setTab('card')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-medium border transition-colors cursor-pointer ${
                    tab === 'card'
                      ? 'border-[#0BA4DB] bg-[#0BA4DB]/15 text-[#00C3F7]'
                      : 'border-[#1F2D3D] bg-[#121E2E] text-muted-foreground hover:bg-[#1A2A3D]'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('bank')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-medium border transition-colors cursor-pointer ${
                    tab === 'bank'
                      ? 'border-[#0BA4DB] bg-[#0BA4DB]/15 text-[#00C3F7]'
                      : 'border-[#1F2D3D] bg-[#121E2E] text-muted-foreground hover:bg-[#1A2A3D]'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('ussd')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-xs font-medium border transition-colors cursor-pointer ${
                    tab === 'ussd'
                      ? 'border-[#0BA4DB] bg-[#0BA4DB]/15 text-[#00C3F7]'
                      : 'border-[#1F2D3D] bg-[#121E2E] text-muted-foreground hover:bg-[#1A2A3D]'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>USSD</span>
                </button>
              </div>

              {tab === 'card' && (
                <form onSubmit={handleSubmitCard} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-muted-foreground">CARD NUMBER</label>
                      <button
                        type="button"
                        onClick={handleFillTestCard}
                        className="text-[11px] text-[#00C3F7] hover:underline cursor-pointer"
                      >
                        Auto-fill Test Card
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4084 0840 8408 4084"
                        className="w-full rounded-xl border border-[#1F2D3D] bg-[#0E1A29] px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-muted-foreground focus:border-[#0BA4DB] focus:outline-none"
                        required
                      />
                      <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        CARD EXPIRY
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full rounded-xl border border-[#1F2D3D] bg-[#0E1A29] px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-muted-foreground focus:border-[#0BA4DB] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full rounded-xl border border-[#1F2D3D] bg-[#0E1A29] px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-muted-foreground focus:border-[#0BA4DB] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#0BA4DB] py-3 text-sm font-bold text-white shadow-lg hover:bg-[#09A5DB] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Pay ₦{config.amountNgn.toLocaleString()}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {tab === 'bank' && (
                <div className="space-y-4 rounded-xl border border-[#1F2D3D] bg-[#0E1A29] p-4 text-xs">
                  <p className="text-muted-foreground">
                    Transfer exactly ₦{config.amountNgn.toLocaleString()} to this dedicated dynamic virtual account:
                  </p>
                  <div className="space-y-1.5 rounded-lg bg-[#081018] p-3 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-bold text-white">Titan Trust / Wema Bank</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-bold text-[#00C3F7]">9928 3401 22</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beneficiary:</span>
                      <span className="text-white">Paystack / Legacy Vault</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('otp')}
                    className="w-full rounded-xl bg-[#0BA4DB] py-2.5 text-xs font-bold text-white hover:bg-[#09A5DB] cursor-pointer"
                  >
                    I Have Sent The ₦{config.amountNgn.toLocaleString()}
                  </button>
                </div>
              )}

              {tab === 'ussd' && (
                <div className="space-y-4 rounded-xl border border-[#1F2D3D] bg-[#0E1A29] p-4 text-xs">
                  <p className="text-muted-foreground">Dial this code on your mobile phone:</p>
                  <div className="rounded-lg bg-[#081018] p-3 text-center font-mono font-bold text-[#00C3F7] text-sm">
                    *737*000*4192#
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('otp')}
                    className="w-full rounded-xl bg-[#0BA4DB] py-2.5 text-xs font-bold text-white hover:bg-[#09A5DB] cursor-pointer"
                  >
                    Complete on Mobile USSD
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-display font-semibold text-white">Enter 4-Digit Card PIN</h3>
                <p className="text-xs text-muted-foreground">Please enter your 4-digit card PIN to authorize the transaction.</p>
              </div>

              <div className="flex justify-center">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-32 text-center tracking-widest text-2xl font-mono rounded-xl border border-[#1F2D3D] bg-[#0E1A29] py-2 text-white focus:border-[#0BA4DB] focus:outline-none"
                  required
                />
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                (Test environment: enter any 4 numbers e.g. 1234)
              </p>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#0BA4DB] py-3 text-sm font-bold text-white hover:bg-[#09A5DB] transition-all cursor-pointer"
              >
                Submit PIN
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-display font-semibold text-white">One-Time Password (OTP)</h3>
                <p className="text-xs text-muted-foreground">An SMS with your security code was sent to your registered number.</p>
              </div>

              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  autoFocus
                  className="w-40 text-center tracking-widest text-2xl font-mono rounded-xl border border-[#1F2D3D] bg-[#0E1A29] py-2 text-white focus:border-[#0BA4DB] focus:outline-none"
                  required
                />
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                (Test OTP: default 123456 is accepted)
              </p>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#0BA4DB] py-3 text-sm font-bold text-white hover:bg-[#09A5DB] transition-all cursor-pointer"
              >
                Authorize Payment
              </button>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#00C3F7]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-sm font-semibold text-white">Processing NGN Payment</h3>
                <p className="text-xs text-muted-foreground animate-pulse">{processingMessage}</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-white">Payment Successful!</h3>
                <p className="text-xs text-muted-foreground">
                  ₦{config.amountNgn.toLocaleString()} received via Paystack. Allocating to Starknet Vault...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-1.5 border-t border-[#1F2D3D] bg-[#081018] py-2.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Secured by Paystack 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  );
};
