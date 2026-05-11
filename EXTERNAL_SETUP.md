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

## 5. Environment Variables
Verify your `.env` contains:
```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=...
# Optional for backend:
# PAYSTACK_SECRET_KEY=...
```
