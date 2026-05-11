// QR code generation and validation utilities
// Payload: base64-encoded JSON with order details

export interface QRPayload {
  order_id: string;
  collection_code: string;
  restaurant_id: string;
  customer_id: string;
  amount: number;
  expires_at: string;
}

// Generate a collection code in the format CQ-X X X X X
export function generateCollectionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CQ-';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Serialize QR payload to base64 string
export function encodeQRPayload(payload: QRPayload): string {
  return btoa(JSON.stringify(payload));
}

// Deserialize QR payload from base64 string
export function decodeQRPayload(encoded: string): QRPayload | null {
  try {
    return JSON.parse(atob(encoded)) as QRPayload;
  } catch {
    return null;
  }
}

// Validate QR payload is not expired
export function isQRValid(payload: QRPayload): boolean {
  return new Date(payload.expires_at) > new Date();
}

// Format order amount for display
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
