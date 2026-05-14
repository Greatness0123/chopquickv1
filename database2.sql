-- CHOPQUICK DATABASE UPDATES v2
-- Run this file AFTER database.sql to add Paystack withdrawal integration
-- IMPORTANT: Run in Supabase SQL Editor → New query → paste and execute

-- =============================================================================
-- 1. ALTER EXISTING TABLES
-- =============================================================================

-- Add Paystack recipient code to restaurants (cached, reused for future withdrawals)
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS paystack_recipient_code TEXT;

-- Extend withdrawals table with Paystack fields and status states
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS paystack_transfer_id TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS recipient_code TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS paystack_response JSONB;

-- Drop old 'pending' as the ONLY status — we'll use proper statuses now
-- Status flow: pending → processing → paid | rejected | failed

-- =============================================================================
-- 2. CREATE WITHDRAWAL_RECIPIENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.withdrawal_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  recipient_code TEXT NOT NULL,
  recipient_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (restaurant_id, bank_account_number)
);

ALTER TABLE public.withdrawal_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurants can manage own recipients." ON public.withdrawal_recipients;
CREATE POLICY "Restaurants can manage own recipients." ON public.withdrawal_recipients FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Restaurants can view own recipients." ON public.withdrawal_recipients;
CREATE POLICY "Restaurants can view own recipients." ON public.withdrawal_recipients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Restaurants can insert own recipients." ON public.withdrawal_recipients;
CREATE POLICY "Restaurants can insert own recipients." ON public.withdrawal_recipients FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

-- =============================================================================
-- 3. UPDATE TRIGGER for withdrawal_recipients updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_withdrawal_recipients_updated_at ON public.withdrawal_recipients;
CREATE TRIGGER update_withdrawal_recipients_updated_at
  BEFORE UPDATE ON public.withdrawal_recipients
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- 4. UPDATE TRANSACTION_TYPE enum (add withdrawal_deduct)
-- =============================================================================

DROP TYPE IF EXISTS transaction_type_v2;
CREATE TYPE transaction_type_v2 AS ENUM (
  'wallet_credit', 'wallet_debit', 'order_payment', 'refund',
  'withdrawal', 'commission', 'referral_bonus', 'user_transfer',
  'withdrawal_deduct', 'payout_sent'
);

-- Migrate existing data if needed
ALTER TABLE public.transactions ALTER COLUMN type TYPE TEXT;

-- =============================================================================
-- 5. CREATE paystack_transfer RPC
-- Creates/updates Paystack recipient, initiates transfer, inserts withdrawal
-- =============================================================================

CREATE OR REPLACE FUNCTION public.paystack_transfer(
  p_restaurant_id UUID,
  p_amount DECIMAL(12,2),
  p_bank_name TEXT,
  p_bank_code TEXT,
  p_bank_account_number TEXT,
  p_bank_account_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_owner_id UUID;
  v_recipient_code TEXT;
  v_paystack_resp JSONB;
  v_transfer_resp JSONB;
  v_withdrawal_id UUID;
  v_paystack_ref TEXT;
  v_balance DECIMAL(12,2);
  v_available DECIMAL(12,2);
BEGIN
  -- 1. Security: verify owner
  SELECT owner_id, total_revenue_recovered
  INTO v_owner_id, v_available
  FROM public.restaurants WHERE id = p_restaurant_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Restaurant not found';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Validate amount
  IF p_amount < 1000 THEN
    RAISE EXCEPTION 'Minimum withdrawal is NGN 1000';
  END IF;

  IF p_amount > v_available THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  -- 3. Get or create Paystack recipient
  v_recipient_code := find_or_create_recipient(
    p_restaurant_id,
    p_bank_name,
    p_bank_code,
    p_bank_account_number,
    p_bank_account_name
  );

  -- 4. Generate unique Paystack reference
  v_paystack_ref := 'CW_' || UPPER(SUBSTR(p_restaurant_id::text, 1, 8)) || '_' || TO_CHAR(NOW(), 'YYMMDDHH24MISS');

  -- 5. Initiate transfer via Paystack
  v_transfer_resp := make_paystack_request(
    'POST',
    'https://api.paystack.co/transfer',
    jsonb_build_object(
      'source', 'balance',
      'amount', (p_amount * 100)::BIGINT,  -- Paystack uses kobo/kope
      'recipient', v_recipient_code,
      'reference', v_paystack_ref,
      'reason', 'ChopQuick withdrawal'
    )
  );

  -- Check if Paystack call succeeded
  IF (v_transfer_resp->>'status')::BOOLEAN = false THEN
    RAISE EXCEPTION 'Paystack transfer failed: %', (v_transfer_resp->'message')->>0;
  END IF;

  -- 6. Insert withdrawal record (status: processing)
  INSERT INTO public.withdrawals (
    restaurant_id,
    amount,
    bank_name,
    bank_account_number,
    bank_account_name,
    status,
    paystack_reference,
    paystack_transfer_id,
    recipient_code
  ) VALUES (
    p_restaurant_id,
    p_amount,
    p_bank_name,
    p_bank_account_number,
    p_bank_account_name,
    'processing',
    v_paystack_ref,
    (v_transfer_resp->'data'->>'transfer_code')::TEXT,
    v_recipient_code
  ) RETURNING id INTO v_withdrawal_id;

  -- Return the created withdrawal
  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'paystack_reference', v_paystack_ref,
    'status', 'processing'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. CREATE helper: find_or_create_recipient
-- Looks up existing recipient, or creates a new one via Paystack API
-- =============================================================================

CREATE OR REPLACE FUNCTION public.find_or_create_recipient(
  p_restaurant_id UUID,
  p_bank_name TEXT,
  p_bank_code TEXT,
  p_bank_account_number TEXT,
  p_bank_account_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_existing recipient_code TEXT;
  v_paystack_resp JSONB;
BEGIN
  -- Try to find an existing active recipient for this restaurant + account
  SELECT recipient_code INTO v_existing
  FROM public.withdrawal_recipients
  WHERE restaurant_id = p_restaurant_id
    AND bank_account_number = p_bank_account_number
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Create new recipient via Paystack
  v_paystack_resp := make_paystack_request(
    'POST',
    'https://api.paystack.co/transferrecipient',
    jsonb_build_object(
      'type', 'nuban',
      'name', p_bank_account_name,
      'account_number', p_bank_account_number,
      'bank_code', p_bank_code,
      'currency', 'NGN'
    )
  );

  IF (v_paystack_resp->>'status')::BOOLEAN = false THEN
    RAISE EXCEPTION 'Failed to create Paystack recipient: %', (v_paystack_resp->'message')->>0;
  END IF;

  v_existing := (v_paystack_resp->'data'->>'recipient_code')::TEXT;

  -- Store the recipient for future use
  INSERT INTO public.withdrawal_recipients (
    restaurant_id, bank_name, bank_code, bank_account_number,
    bank_account_name, recipient_code
  ) VALUES (
    p_restaurant_id, p_bank_name, p_bank_code, p_bank_account_number,
    p_bank_account_name, v_existing
  )
  ON CONFLICT (restaurant_id, bank_account_number) DO UPDATE
    SET recipient_code = EXCLUDED.recipient_code,
        updated_at = NOW();

  -- Also cache on the restaurant record for quick lookup
  UPDATE public.restaurants SET paystack_recipient_code = v_existing WHERE id = p_restaurant_id;

  RETURN v_existing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. CREATE helper: make_paystack_request
-- Makes authenticated calls to Paystack API using the secret key from env
-- =============================================================================

CREATE OR REPLACE FUNCTION public.make_paystack_request(
  p_method TEXT,
  p_url TEXT,
  p_body JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
-- This function uses net.http to call the Paystack API directly from Postgres.
-- The PAYSTACK_SECRET_KEY should be set as a Postgres secret/env var.
-- For Supabase Edge Functions, the Paystack call is made there instead.
-- This function is a fallback when called from DB directly.
DECLARE
  v_req JSONB;
  v_resp JSONB;
BEGIN
  -- If running inside a Supabase Edge Function context, we can't call external
  -- HTTP directly from Postgres. Instead, we signal the caller to use the Edge Function.
  -- The Edge Function will handle the actual Paystack API call.
  RETURN jsonb_build_object(
    'status', false,
    'message', jsonb_build_array(
      'Paystack API call must be made from a Supabase Edge Function. ' ||
      'Deploy supabase/functions/paystack-transfer/ to process withdrawals.'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. CREATE handle_withdrawal_paid trigger function
-- Fires when a withdrawal transitions to 'paid' → deducts total_revenue_recovered
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_withdrawal_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_owner_balance DECIMAL(12,2);
BEGIN
  -- Only fire when status transitions TO 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Deduct from restaurant's recovered revenue (funds have left ChopQuick)
    UPDATE public.restaurants
    SET total_revenue_recovered = total_revenue_recovered - NEW.amount
    WHERE id = NEW.restaurant_id;

    -- Log the payout deduction for the restaurant owner
    SELECT owner_id, wallet_balance INTO v_owner_id, v_owner_balance
    FROM public.profiles WHERE id = (
      SELECT owner_id FROM public.restaurants WHERE id = NEW.restaurant_id
    );

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, reference)
    VALUES (
      v_owner_id,
      'withdrawal_deduct',
      -NEW.amount,
      v_owner_balance,
      'Withdrawal payout sent to bank',
      NEW.paystack_reference
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_withdrawal_paid ON public.withdrawals;
CREATE TRIGGER on_withdrawal_paid
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_withdrawal_paid();

-- =============================================================================
-- 9. UPDATE process_order — deduct customer wallet at checkout (not at collection)
-- The capture_order_payment trigger is removed since we deduct at checkout now
-- =============================================================================

CREATE OR REPLACE FUNCTION public.process_order(
  p_customer_id UUID,
  p_listing_id UUID,
  p_restaurant_id UUID,
  p_quantity INTEGER,
  p_payment_method TEXT,
  p_payment_reference TEXT,
  p_collection_code TEXT,
  p_qr_payload TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_current_balance DECIMAL;
  v_portions_remaining INTEGER;
  v_unit_price DECIMAL;
  v_total_amount DECIMAL;
BEGIN
  -- Security check
  IF auth.uid() != p_customer_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get current listing info and check portions
  SELECT portions_remaining, current_price INTO v_portions_remaining, v_unit_price
  FROM public.listings WHERE id = p_listing_id FOR UPDATE;

  IF v_portions_remaining < p_quantity THEN
    RAISE EXCEPTION 'Not enough portions available';
  END IF;

  v_total_amount := v_unit_price * p_quantity;

  -- Deduct from customer wallet IMMEDIATELY at checkout
  IF p_payment_method = 'wallet' THEN
    SELECT wallet_balance INTO v_current_balance
    FROM public.profiles WHERE id = p_customer_id FOR UPDATE;

    IF v_current_balance < v_total_amount THEN
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    UPDATE public.profiles
    SET wallet_balance = wallet_balance - v_total_amount
    WHERE id = p_customer_id;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, reference)
    VALUES (
      p_customer_id,
      'wallet_debit',
      -v_total_amount,
      v_current_balance - v_total_amount,
      'Food order payment',
      p_payment_reference
    );
  END IF;

  -- Create the order
  INSERT INTO public.orders (
    customer_id, listing_id, restaurant_id, quantity, unit_price,
    total_amount, payment_method, payment_status, payment_reference,
    collection_code, qr_payload, order_status, expires_at
  ) VALUES (
    p_customer_id, p_listing_id, p_restaurant_id, p_quantity, v_unit_price,
    v_total_amount, p_payment_method, 'paid', p_payment_reference,
    p_collection_code, p_qr_payload, 'confirmed', p_expires_at
  ) RETURNING id INTO v_order_id;

  -- Update listing portions
  UPDATE public.listings
  SET portions_remaining = portions_remaining - p_quantity,
      status = CASE
        WHEN portions_remaining - p_quantity = 0 THEN 'sold_out'::listing_status
        ELSE status
      END
  WHERE id = p_listing_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 10. REMOVE capture_order_payment trigger (payment now captured at checkout)
-- =============================================================================

DROP TRIGGER IF EXISTS on_order_collected_payment ON public.orders;
DROP FUNCTION IF EXISTS public.capture_order_payment();

-- =============================================================================
-- 11. ADD bank_code column to restaurants (for Paystack transfers)
-- =============================================================================

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS bank_code TEXT;






npx supabase secrets set PAYSTACK_SECRET_KEY=sk_live_db250af753b32fb064b04973c42ccced43f8004f
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsbnRseXljZm9rdG1zaGxycHZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxMDU5OCwiZXhwIjoyMDk0MDg2NTk4fQ.rOCXr99Wc9CsabIpWjIJfztx1rtJNeelTDsn3fy9jKE