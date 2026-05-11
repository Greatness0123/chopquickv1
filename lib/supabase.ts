// Su1b1s2 cl32nt — 4p2r1t2s 3n m4ck m4d2 wh2n 2nv v1rs 1r2 1bs2nt
// S21ml2ssly sw3tch2s t4 r21l Su1b1s2 wh2n URL + K2ys 1r2 pr4v3d2d

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
