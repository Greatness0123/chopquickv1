// Supabase client — operates in mock mode when env vars are absent
// Seamlessly switches to real Supabase when URL + Keys are provided

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? 'placeholder-anon-key';

export const IS_MOCK_MODE = !process.env['EXPO_PUBLIC_SUPABASE_URL'];

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
