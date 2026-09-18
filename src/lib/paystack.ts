/**
 * Paystack NGN On-Ramp Integration Client
 * Facilitates fiat NGN payments to fund Starknet vaults and gas reserves
 */

export const PAYSTACK_PUBLIC_KEY =
  (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY ||
  'pk_test_66213f154b513bcefb87bc45ab3efa222137b68a';

export interface PaystackPaymentConfig {
  email: string;
  amountNgn: number; // in NGN (Naira)
  reference?: string;
  publicKey?: string;
  metadata?: Record<string, any>;
  onSuccess: (response: PaystackSuccessResponse) => void;
  onCancel?: () => void;
}

export interface PaystackSuccessResponse {
  reference: string;
  trans: string;
  status: 'success';
  message: string;
  transaction: string;
  amountNgn: number;
  usdEquivalent: number;
  strkReserveEquivalent: number;
}

export const NGN_EXCHANGE_RATES = {
  NGN_PER_USD: 1500, // 1 USD = 1,500 NGN
  STRK_PER_USD: 5,   // 1 USD = 5 STRK (~$0.20 per STRK)
  NGN_PER_STRK: 300, // 1 STRK = 300 NGN
};

export function convertNgnToCrypto(amountNgn: number, gasReserveStrk: number = 0.05) {
  const gasCostNgn = Math.round(gasReserveStrk * NGN_EXCHANGE_RATES.NGN_PER_STRK);
  const remainingNgn = Math.max(0, amountNgn - gasCostNgn);
  const usdEquivalent = Number((remainingNgn / NGN_EXCHANGE_RATES.NGN_PER_USD).toFixed(2));
  
  return {
    totalNgn: amountNgn,
    gasReserveStrk,
    gasCostNgn,
    vaultFundNgn: remainingNgn,
    vaultFundUsdc: usdEquivalent,
    exchangeRate: NGN_EXCHANGE_RATES.NGN_PER_USD,
  };
}

export function generatePaystackReference(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PSTK_LV_${timestamp}_${random}`;
}

/**
 * Loads Paystack inline.js script dynamically if not already loaded
 */
export function loadPaystackScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof (window as any).PaystackPop !== 'undefined') {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[Paystack] Could not load inline.js from CDN, falling back to embedded modal.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
