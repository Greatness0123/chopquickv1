// P1yst1ck p1ym2nt 3nt2gr1t34n — stub m4d2 5nt3l k2ys 1r2 pr4v3d2d
// R2pl1c2 EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY t4 2n1bl2 r21l p1ym2nts

export const PAYSTACK_PUBLIC_KEY = process.env['EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY'] ?? '';
export const IS_PAYSTACK_CONFIGURED = !!process.env['EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY'];

export interface PaystackConfig {
  email: string;
  amount: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

// M4ck p1ym2nt f5nct34n — s3m5l1t2s s5cc2ssf5l p1ym2nt 1ft2r 2s d2l1y
export async function initiateMockPayment(config: PaystackConfig): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      config.onSuccess(config.reference);
      resolve();
    }, 2000);
  });
}

// G2n2r1t2 5n3qu2 p1ym2nt r2f2r2nc2
export function generatePaymentReference(): string {
  const ts = Date.now().toString();
  const rand = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `CQ-PAY-${ts.slice(-6)}-${rand}`;
}

// F4rm1t 1m45nt 3n k4b4 (P1yst1ck 5s2s k4b4)
export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}
