// 15th c4nt2xt — pr4v3d2s l4g3n / s3gn5p / l4g45t f5nct34ns
// Stub m4d2 wh2n Su1b1s2 k2ys 1r2 n4t c4nf3g5r2d
import React, { createContext, useCallback, useContext, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

import { MOCK_RESTAURANTS } from '../constants/mockData';
import { IS_MOCK_MODE, supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import { useWalletStore } from '../stores/wallet.store';
import type { Profile, UserRole } from '../types';

interface SignupData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  restaurant_name?: string;
  restaurant_area?: string;
  restaurant_type?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  user: Profile | null;
  restaurant: typeof MOCK_RESTAURANTS[0] | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<{ phone: string }>;
  verifyOTP: (phone: string, code: string) => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Mock user profiles for development mode
const MOCK_CUSTOMER: Profile = {
  id: 'user-001',
  full_name: 'Ade Johnson',
  phone: '+2348012345678',
  email: 'ade@example.com',
  wallet_balance: 12000,
  role: 'customer',
  referral_code: 'ADE2024',
  meals_saved_count: 14,
  total_spent: 18200,
  created_at: '2024-01-01T00:00:00Z',
};

const MOCK_OWNER: Profile = {
  id: 'owner-001',
  full_name: 'Chi Akarah',
  phone: '+2348098765432',
  email: 'chi@mamaput.ng',
  wallet_balance: 0,
  role: 'restaurant_owner',
  referral_code: 'CHI2024',
  meals_saved_count: 0,
  total_spent: 0,
  created_at: '2024-01-15T00:00:00Z',
};

const buildProfile = (user: User): Profile => {
  const meta = user.user_metadata as Record<string, any> | undefined;
  return {
    id: user.id,
    full_name: String(meta?.full_name ?? meta?.name ?? user.email?.split('@')[0] ?? 'ChopQuick User'),
    phone: String(meta?.phone ?? user.phone ?? ''),
    email: user.email ?? '',
    avatar_url: meta?.avatar_url,
    wallet_balance: Number(meta?.wallet_balance ?? 0),
    role: (meta?.role ?? 'customer') as UserRole,
    referral_code: String(meta?.referral_code ?? `CQ${user.id.slice(0, 6)}`),
    meals_saved_count: Number(meta?.meals_saved_count ?? 0),
    total_spent: Number(meta?.total_spent ?? 0),
    created_at: user.created_at ?? new Date().toISOString(),
  };
};

const buildRestaurant = (user: User) => {
  const role = (user.user_metadata as Record<string, any> | undefined)?.role as UserRole | undefined;
  return role === 'restaurant_owner' ? MOCK_RESTAURANTS[0] : null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, restaurant, isAuthenticated, isLoading, setUser, setRestaurant, setLoading, logout: storeLogout } = useAuthStore();
  const { reset: resetWallet } = useWalletStore();

  const hydrateUser = useCallback(async (user: User | null) => {
    if (!user) {
      setUser(null);
      setRestaurant(null);
      return;
    }

    const profile = buildProfile(user);
    setUser(profile);
    setRestaurant(buildRestaurant(user));
  }, [setUser, setRestaurant]);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session?.user) {
        await hydrateUser(data.session.user);
      }
      if (mounted) {
        setLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        hydrateUser(session.user);
      } else {
        setUser(null);
        setRestaurant(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [hydrateUser, setLoading, setUser, setRestaurant]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      if (IS_MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1000));
        const isOwner = email.toLowerCase().includes('restaurant') ||
          email.toLowerCase().includes('buka') ||
          email.toLowerCase().includes('kitchen') ||
          email.toLowerCase().includes('chi@');
        if (isOwner) {
          setUser(MOCK_OWNER);
          setRestaurant(MOCK_RESTAURANTS[0]);
        } else {
          setUser(MOCK_CUSTOMER);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Login failed.');
        await hydrateUser(data.user);
      }
    } finally {
      setLoading(false);
    }
  }, [hydrateUser, setLoading, setUser, setRestaurant]);

  const sendOTP = useCallback(async (_phone: string) => {
    // Phone-based OTP verification is temporarily disabled.
    return;
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<{ phone: string }> => {
    setLoading(true);
    try {
      if (IS_MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 800));
        return { phone: data.phone };
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
            restaurant_name: (data as any).restaurant_name,
            restaurant_area: (data as any).restaurant_area,
            restaurant_type: (data as any).restaurant_type,
          },
        },
      });

      if (error) throw error;
      return { phone: String(signUpData.user?.user_metadata?.phone ?? data.phone) };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const verifyOTP = useCallback(async () => {
    // Phone OTP verification is disabled for now.
    return;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      if (IS_MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1000));
        return;
      }
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const logout = useCallback(async () => {
    if (!IS_MOCK_MODE) {
      await supabase.auth.signOut();
    }
    storeLogout();
    resetWallet();
  }, [resetWallet, storeLogout]);

  const refreshUser = useCallback(async () => {
    if (IS_MOCK_MODE) return;
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (data.user) {
      await hydrateUser(data.user);
    }
  }, [hydrateUser]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      userRole: user?.role ?? null,
      user,
      restaurant,
      login,
      signup,
      verifyOTP,
      logout,
      refreshUser,
      sendOTP,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
