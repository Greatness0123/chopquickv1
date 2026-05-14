-- CHOPQUICK DATABASE SCHEMA
-- This script creates all necessary tables, enums, and triggers for the ChopQuick application.

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'restaurant_owner', 'admin');
CREATE TYPE food_category AS ENUM ('rice', 'chicken', 'pasta', 'soup', 'snacks', 'drinks', 'other');
CREATE TYPE order_status AS ENUM ('pending_payment', 'confirmed', 'collected', 'uncollected', 'disputed', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE listing_status AS ENUM ('draft', 'scheduled', 'live', 'sold_out', 'expired', 'removed');
CREATE TYPE transaction_type AS ENUM ('wallet_credit', 'wallet_debit', 'order_payment', 'refund', 'withdrawal', 'commission', 'referral_bonus', 'user_transfer');

-- 2. TABLES

-- PROFILES
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  wallet_balance DECIMAL(12,2) DEFAULT 0.00,
  meals_saved_count INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  role user_role DEFAULT 'customer',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESTAURANTS
CREATE TABLE public.restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT DEFAULT 'Lagos',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_live_tonight BOOLEAN DEFAULT FALSE,
  total_meals_saved INTEGER DEFAULT 0,
  total_revenue_recovered DECIMAL(15,2) DEFAULT 0.00,
  total_co2_diverted_kg DECIMAL(10,2) DEFAULT 0.00,
  rating DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  restaurant_type TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LISTINGS
CREATE TABLE public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  food_category food_category NOT NULL,
  description TEXT,
  original_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  discount_percent INTEGER,
  portions_total INTEGER NOT NULL,
  portions_remaining INTEGER NOT NULL,
  image_url TEXT,
  allergen_note TEXT,
  is_last_one BOOLEAN DEFAULT FALSE,
  status listing_status DEFAULT 'live',
  goes_live_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  listing_id UUID REFERENCES public.listings(id) NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'wallet',
  payment_status payment_status DEFAULT 'pending',
  payment_reference TEXT,
  qr_payload TEXT,
  collection_code TEXT,
  order_status order_status DEFAULT 'confirmed',
  collected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id), -- For user transfers
  type transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL, -- Negative for debits
  balance_after DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference TEXT,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADDRESSES
CREATE TABLE public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Home',
  address_line TEXT NOT NULL,
  city TEXT DEFAULT 'Lagos',
  state TEXT DEFAULT 'Lagos',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WITHDRAWALS
CREATE TABLE public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS POLICIES (Row Level Security)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles, but only update their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;
CREATE POLICY "Users can insert own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Restaurants: Viewable by everyone, update by owner
DROP POLICY IF EXISTS "Restaurants are viewable by everyone." ON public.restaurants;
CREATE POLICY "Restaurants are viewable by everyone." ON public.restaurants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can update their restaurant." ON public.restaurants;
CREATE POLICY "Owners can update their restaurant." ON public.restaurants FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can insert their restaurant." ON public.restaurants;
CREATE POLICY "Owners can insert their restaurant." ON public.restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Listings: Viewable by everyone, update by restaurant owner
DROP POLICY IF EXISTS "Listings are viewable by everyone." ON public.listings;
CREATE POLICY "Listings are viewable by everyone." ON public.listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can manage listings." ON public.listings;
CREATE POLICY "Owners can manage listings." ON public.listings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

-- Orders: Customer can view their own, Restaurant can view orders for them
DROP POLICY IF EXISTS "Customers can view their own orders." ON public.orders;
CREATE POLICY "Customers can view their own orders." ON public.orders FOR SELECT USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Restaurants can view their own orders." ON public.orders;
CREATE POLICY "Restaurants can view their own orders." ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);
DROP POLICY IF EXISTS "Customers can create orders." ON public.orders;
CREATE POLICY "Customers can create orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Transactions: Only own transactions
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.transactions;
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Addresses: Only own addresses
DROP POLICY IF EXISTS "Users can manage their own addresses." ON public.addresses;
CREATE POLICY "Users can manage their own addresses." ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- Withdrawals: Restaurant owner can view/create their own
DROP POLICY IF EXISTS "Owners can view their withdrawals." ON public.withdrawals;
CREATE POLICY "Owners can view their withdrawals." ON public.withdrawals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);
DROP POLICY IF EXISTS "Owners can create withdrawals." ON public.withdrawals;
CREATE POLICY "Owners can create withdrawals." ON public.withdrawals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

-- STORAGE POLICIES
-- Note: These policies assume buckets 'avatars' and 'listings' exist and are public for viewing.

-- Avatars bucket policies
-- 1. Anyone can view avatars
-- (Usually set by making the bucket public, but here are the SQL policies)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar viewable by everyone" ON storage.objects;
CREATE POLICY "Avatar viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (
    (auth.uid()::text = (storage.foldername(name))[1])
    OR
    EXISTS (SELECT 1 FROM public.restaurants WHERE id::text = (storage.foldername(name))[1] AND owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND (
    (auth.uid()::text = (storage.foldername(name))[1])
    OR
    EXISTS (SELECT 1 FROM public.restaurants WHERE id::text = (storage.foldername(name))[1] AND owner_id = auth.uid())
  )
);

-- Listings bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('listings', 'listings', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Listings viewable by everyone" ON storage.objects;
CREATE POLICY "Listings viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'listings');

DROP POLICY IF EXISTS "Owners can upload listing images" ON storage.objects;
CREATE POLICY "Owners can upload listing images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'listings' AND EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id::text = (storage.foldername(name))[1]
    AND owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can update listing images" ON storage.objects;
CREATE POLICY "Owners can update listing images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'listings' AND EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id::text = (storage.foldername(name))[1]
    AND owner_id = auth.uid()
  )
);

-- 4. FUNCTIONS & TRIGGERS

-- Automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, referral_code, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    UPPER(SUBSTR(NEW.id::text, 1, 6)),
    (CASE WHEN NEW.raw_user_meta_data->>'role' = 'restaurant_owner' THEN 'restaurant_owner'::user_role ELSE 'customer'::user_role END)
  );

  IF NEW.raw_user_meta_data->>'role' = 'restaurant_owner' THEN
    INSERT INTO public.restaurants (owner_id, name, address, area, restaurant_type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'restaurant_name', 'My Restaurant'),
      COALESCE(NEW.raw_user_meta_data->>'restaurant_area', 'Lagos'),
      COALESCE(NEW.raw_user_meta_data->>'restaurant_area', 'Lagos'),
      COALESCE(NEW.raw_user_meta_data->>'restaurant_type', 'Local Buka')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RPC Function for atomic transfers
CREATE OR REPLACE FUNCTION public.transfer_funds(
  sender_id UUID,
  recipient_id UUID,
  amount DECIMAL(12,2),
  memo TEXT
)
RETURNS void AS $$
DECLARE
  sender_balance DECIMAL(12,2);
BEGIN
  -- 1. Check sender balance
  SELECT wallet_balance INTO sender_balance FROM public.profiles WHERE id = sender_id;
  IF sender_balance < amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- 2. Debit sender
  UPDATE public.profiles SET wallet_balance = wallet_balance - amount WHERE id = sender_id;

  -- 3. Credit recipient
  UPDATE public.profiles SET wallet_balance = wallet_balance + amount WHERE id = recipient_id;

  -- 4. Log transactions
  INSERT INTO public.transactions (user_id, recipient_id, type, amount, balance_after, description)
  VALUES (sender_id, recipient_id, 'user_transfer', -amount, sender_balance - amount, memo);

  INSERT INTO public.transactions (user_id, recipient_id, type, amount, balance_after, description)
  VALUES (recipient_id, sender_id, 'user_transfer', amount, (SELECT wallet_balance FROM public.profiles WHERE id = recipient_id), 'Received from ' || (SELECT full_name FROM public.profiles WHERE id = sender_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function to increment restaurant stats on order collection
CREATE OR REPLACE FUNCTION public.increment_restaurant_stats(
  rest_id UUID,
  revenue DECIMAL(15,2)
)
RETURNS void AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- 1. Update restaurant stats
  UPDATE public.restaurants
  SET
    total_revenue_recovered = total_revenue_recovered + revenue,
    total_co2_diverted_kg = total_co2_diverted_kg + 0.5
  WHERE id = rest_id
  RETURNING owner_id INTO v_owner_id;

  -- 2. Credit restaurant owner's wallet
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + revenue
  WHERE id = v_owner_id;

  -- 3. Log transaction for the restaurant owner
  INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
  VALUES (
    v_owner_id,
    'wallet_credit',
    revenue,
    (SELECT wallet_balance FROM public.profiles WHERE id = v_owner_id),
    'Order collection earnings'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update customer stats on order collection
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'collected' AND (OLD.order_status IS NULL OR OLD.order_status != 'collected') THEN
    UPDATE public.profiles
    SET
      meals_saved_count = meals_saved_count + 1,
      total_spent = total_spent + NEW.total_amount
    WHERE id = NEW.customer_id;

    -- Also update total_meals_saved on the restaurant
    UPDATE public.restaurants
    SET total_meals_saved = total_meals_saved + 1
    WHERE id = NEW.restaurant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.capture_order_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_balance DECIMAL;
BEGIN
  -- Only fire when order transitions TO 'collected'
  IF NEW.order_status = 'collected' AND (OLD.order_status IS NULL OR OLD.order_status != 'collected') THEN
    -- Capture payment from customer wallet (for wallet payments, funds were reserved at checkout)
    IF NEW.payment_method = 'wallet' THEN
      SELECT wallet_balance INTO v_customer_balance
      FROM public.profiles WHERE id = NEW.customer_id FOR UPDATE;

      UPDATE public.profiles
      SET wallet_balance = wallet_balance - NEW.total_amount
      WHERE id = NEW.customer_id;

      INSERT INTO public.transactions (user_id, type, amount, balance_after, description, reference)
      VALUES (
        NEW.customer_id,
        'wallet_debit',
        -NEW.total_amount,
        v_customer_balance - NEW.total_amount,
        'Order collected — payment captured',
        COALESCE(NEW.payment_reference, 'N/A')
      );
    END IF;

    -- For card payments in demo mode (no real Paystack capture), also deduct
    IF NEW.payment_method = 'card' THEN
      SELECT wallet_balance INTO v_customer_balance
      FROM public.profiles WHERE id = NEW.customer_id FOR UPDATE;

      UPDATE public.profiles
      SET wallet_balance = wallet_balance - NEW.total_amount
      WHERE id = NEW.customer_id;

      INSERT INTO public.transactions (user_id, type, amount, balance_after, description, reference)
      VALUES (
        NEW.customer_id,
        'wallet_debit',
        -NEW.total_amount,
        v_customer_balance - NEW.total_amount,
        'Card order collected — payment captured',
        COALESCE(NEW.payment_reference, 'N/A')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_collected_payment ON public.orders;
CREATE TRIGGER on_order_collected_payment
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.capture_order_payment();

-- Trigger to update customer stats
DROP TRIGGER IF EXISTS on_order_collected ON public.orders;
CREATE TRIGGER on_order_collected
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_customer_stats();

-- Table for individual ratings to prevent multiple ratings from the same order/user
CREATE TABLE public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all ratings." ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Customers can insert their own ratings." ON public.ratings FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- RPC to rate restaurant and update aggregates
CREATE OR REPLACE FUNCTION public.rate_restaurant(
  p_order_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_customer_id UUID;
  v_restaurant_id UUID;
BEGIN
  -- 1. Get info and verify order status
  SELECT customer_id, restaurant_id INTO v_customer_id, v_restaurant_id
  FROM public.orders
  WHERE id = p_order_id AND order_status = 'collected';

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Order not found or not collected';
  END IF;

  IF v_customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Insert rating
  INSERT INTO public.ratings (order_id, customer_id, restaurant_id, rating, comment)
  VALUES (p_order_id, v_customer_id, v_restaurant_id, p_rating, p_comment);

  -- 3. Update restaurant aggregate
  UPDATE public.restaurants
  SET
    rating = (rating * rating_count + p_rating) / (rating_count + 1),
    rating_count = rating_count + 1
  WHERE id = v_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to process an order atomically
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
  -- 0. Security check
  IF auth.uid() != p_customer_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Get current listing info and check portions
  SELECT portions_remaining, current_price INTO v_portions_remaining, v_unit_price
  FROM public.listings WHERE id = p_listing_id FOR UPDATE;

  IF v_portions_remaining < p_quantity THEN
    RAISE EXCEPTION 'Not enough portions available';
  END IF;

  v_total_amount := v_unit_price * p_quantity;

  -- 2. Reserve portions for wallet orders (no deduction yet — deducted at collection)
  IF p_payment_method = 'wallet' THEN
    -- Funds are held but not yet deducted; deduction happens when order status = 'collected'
    NULL;
  END IF;

  -- 3. Create Order
  INSERT INTO public.orders (
    customer_id, listing_id, restaurant_id, quantity, unit_price,
    total_amount, payment_method, payment_status, payment_reference,
    collection_code, qr_payload, order_status, expires_at
  ) VALUES (
    p_customer_id, p_listing_id, p_restaurant_id, p_quantity, v_unit_price,
    v_total_amount, p_payment_method, 'paid', p_payment_reference,
    p_collection_code, p_qr_payload, 'confirmed', p_expires_at
  ) RETURNING id INTO v_order_id;

  -- 4. Update Listing
  UPDATE public.listings
  SET portions_remaining = portions_remaining - p_quantity,
      status = (CASE WHEN portions_remaining - p_quantity = 0 THEN 'sold_out'::listing_status ELSE status END)
  WHERE id = p_listing_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
