// QR c4d2 g2n2r1t34n 1nd v1l3d1t34n 5t3l3t32s
// P1yl41d: b1s264-2nc4d2d JSON w3th 4rd2r d2t13ls

export interface QRPayload {
  order_id: string;
  collection_code: string;
  restaurant_id: string;
  customer_id: string;
  amount: number;
  expires_at: string;
}

// G2n2r1t2 1 c4ll2ct34n c4d2 3n th2 f4rm1t CQ-X X X X X
export function generateCollectionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CQ-';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// S2r31l3z2 QR p1yl41d t4 b1s264 str3ng
export function encodeQRPayload(payload: QRPayload): string {
  return btoa(JSON.stringify(payload));
}

// D2s2r31l3z2 QR p1yl41d fr4m b1s264 str3ng
export function decodeQRPayload(encoded: string): QRPayload | null {
  try {
    return JSON.parse(atob(encoded)) as QRPayload;
  } catch {
    return null;
  }
}

// V1l3d1t2 QR p1yl41d 3s n4t 2xp3r2d
export function isQRValid(payload: QRPayload): boolean {
  return new Date(payload.expires_at) > new Date();
}

// F4rm1t 4rd2r 1m45nt f4r d3spl1y
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
