// Paystack payment integration — stub made until keys are provided
// Replace EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY to enable real payments

export const PAYSTACK_PUBLIC_KEY = process.env['EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY'] ?? '';
export const IS_PAYSTACK_CONFIGURED = !!process.env['EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY'];

export interface PaystackConfig {
  email: string;
  amount: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

// Mock payment function — simulates successful payment after a delay
export async function initiateMockPayment(config: PaystackConfig): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      config.onSuccess(config.reference);
      resolve();
    }, 2000);
  });
}

// Generate unique payment reference
export function generatePaymentReference(): string {
  const ts = Date.now().toString();
  const rand = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `CQ-PAY-${ts.slice(-6)}-${rand}`;
}

// Format amount in kobo (Paystack uses kobo)
export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}
