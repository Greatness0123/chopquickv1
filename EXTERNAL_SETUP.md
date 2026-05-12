# ChopQuick External Setup Documentation

To ensure all features work correctly, please follow these steps to configure your external services.

## 1. Supabase Storage Buckets
The application requires two storage buckets to be created in your Supabase dashboard:

1.  **`avatars`**:
    -   **Public**: Yes
    -   **Allowed Content Types**: `image/*`
    -   **RLS Policies**:
        -   `SELECT`: Enable for everyone.
        -   `INSERT/UPDATE/DELETE`: Enable for `authenticated` users where `auth.uid() = (storage.foldername(name))[1]`.

2.  **`listings`**:
    -   **Public**: Yes
    -   **Allowed Content Types**: `image/*`
    -   **RLS Policies**:
        -   `SELECT`: Enable for everyone.
        -   `INSERT/UPDATE/DELETE`: Enable for authenticated users who own the restaurant associated with the listing.

## 2. Paystack Webhook Configuration
To handle wallet funding and verify payments securely, you must set up a webhook in your Paystack Dashboard.

-   **Webhook URL**: `https://<your-supabase-project>.functions.supabase.co/paystack-webhook`
-   **Events to listen for**: `charge.success`

### Paystack Secret Key
Ensure your `.env` file (or Supabase secrets) contains your Paystack Secret Key for backend verification.

## 3. Expo Push Notifications
To enable push notifications:

1.  Go to the [Expo Dashboard](https://expo.dev/notifications).
2.  Follow the setup for FCM (Android) and APNs (iOS).
3.  The application will automatically request permissions and save the push token to the `profiles.push_token` column.

## 4. Supabase Database Functions
Ensure you have run the provided `database.sql` script in the Supabase SQL Editor. This script sets up:
-   Automatic profile creation on signup.
-   Wallet balance management.
-   Transaction logging.
-   RLS policies for security.

### Database Updates (Migration)
If you already have an existing database, run these SQL commands to update your schema:

```sql
-- Add stats columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS meals_saved_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_spent DECIMAL(12,2) DEFAULT 0.00;

-- Update handle_new_user to include phone
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

-- Add trigger for customer stats
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'collected' AND (OLD.order_status IS NULL OR OLD.order_status != 'collected') THEN
    UPDATE public.profiles
    SET
      meals_saved_count = meals_saved_count + 1,
      total_spent = total_spent + NEW.total_amount
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_collected ON public.orders;
CREATE TRIGGER on_order_collected
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_customer_stats();
```

## 5. Environment Variables
Verify your `.env` contains:
```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=...
# Optional for backend:
# PAYSTACK_SECRET_KEY=...
```
