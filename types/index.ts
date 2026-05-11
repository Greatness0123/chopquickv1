// Shared type definitions for ChopQuick
// Mirrors the Database schema in TypeScript

export type UserRole = 'customer' | 'restaurant_owner' | 'admin';
export type FoodCategory = 'rice' | 'chicken' | 'pasta' | 'soup' | 'snacks' | 'drinks' | 'other';
export type OrderStatus = 'pending_payment' | 'confirmed' | 'collected' | 'uncollected' | 'disputed' | 'refunded';
export type PaymentMethod = 'wallet' | 'card' | 'bank_transfer' | 'ussd';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ListingStatus = 'draft' | 'scheduled' | 'live' | 'sold_out' | 'expired' | 'removed';
export type TransactionType = 'wallet_credit' | 'wallet_debit' | 'order_payment' | 'refund' | 'withdrawal' | 'commission' | 'referral_bonus';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  avatar_url?: string;
  wallet_balance: number;
  role: UserRole;
  referral_code: string;
  meals_saved_count: number;
  total_spent: number;
  created_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address: string;
  area: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  logo_url?: string;
  is_verified: boolean;
  is_active: boolean;
  is_live_tonight: boolean;
  restaurant_wallet_balance: number;
  total_meals_saved: number;
  total_revenue_recovered: number;
  total_co2_diverted_kg: number;
  rating?: number;
  rating_count: number;
  restaurant_type: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  created_at: string;
}

export interface Listing {
  id: string;
  restaurant_id: string;
  food_name: string;
  food_category: FoodCategory;
  description?: string;
  original_price: number;
  current_price: number;
  discount_percent: number;
  portions_total: number;
  portions_remaining: number;
  image_url?: string;
  allergen_note?: string;
  is_last_one: boolean;
  status: ListingStatus;
  goes_live_at: string;
  expires_at: string;
  restaurant?: Restaurant;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  listing_id: string;
  restaurant_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference?: string;
  qr_payload?: string;
  collection_code?: string;
  order_status: OrderStatus;
  collected_at?: string;
  expires_at: string;
  created_at: string;
  listing?: Listing;
  restaurant?: Restaurant;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  reference?: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  restaurant_id: string;
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference?: string;
  created_at: string;
}

export interface CartItem {
  listing: Listing;
  quantity: number;
}
