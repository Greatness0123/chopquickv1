// Authentication store — persisted with AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Profile, Restaurant, UserRole } from '../types';

interface AuthState {
  user: Profile | null;
  restaurant: Restaurant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  setUser: (user: Profile | null) => void;
  setRestaurant: (restaurant: Restaurant | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      restaurant: null,
      isAuthenticated: false,
      isLoading: true,
      userRole: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          userRole: user?.role ?? null,
        }),

      setRestaurant: (restaurant) => set({ restaurant }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          restaurant: null,
          isAuthenticated: false,
          userRole: null,
        }),
    }),
    {
      name: 'chopquick-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // restaurant excluded — always fetched fresh from Supabase on hydration
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
      }),
    }
  )
);