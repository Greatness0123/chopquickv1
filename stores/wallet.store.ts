// Wallet store — manages balance and transaction history, synced with Supabase
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';

interface WalletState {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  isSynced: boolean;

  syncFromDatabase: (userId: string) => Promise<void>;
  debit: (amount: number, description: string) => void;
  credit: (amount: number, description: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  balance: 0,
  transactions: [] as Transaction[],
  isLoading: false,
  isSynced: false,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      syncFromDatabase: async (userId) => {
        set({ isLoading: true });
        try {
          const [walletResult, txnResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('wallet_balance')
              .eq('id', userId)
              .single(),

            supabase
              .from('transactions')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(50),
          ]);

          if (walletResult.error) throw walletResult.error;
          if (txnResult.error) throw txnResult.error;

          set({
            balance: walletResult.data.wallet_balance,
            transactions: txnResult.data ?? [],
            isSynced: true,
          });
        } catch (error) {
          console.error('[WalletStore] sync failed:', error);
          // Keep stale cached values rather than wiping them on failure
        } finally {
          set({ isLoading: false });
        }
      },

      debit: (amount, description) => {
        const { balance, transactions } = get();
        const newBalance = balance - amount;
        const txn: Transaction = {
          id: `txn-${Date.now()}`,
          user_id: 'user-001',
          type: 'order_payment',
          amount: -amount,
          balance_after: newBalance,
          description,
          created_at: new Date().toISOString(),
        };
        set({ balance: newBalance, transactions: [txn, ...transactions] });
      },

      credit: (amount, description) => {
        const { balance, transactions } = get();
        const newBalance = balance + amount;
        const txn: Transaction = {
          id: `txn-${Date.now()}`,
          user_id: 'user-001',
          type: 'wallet_credit',
          amount,
          balance_after: newBalance,
          description,
          created_at: new Date().toISOString(),
        };
        set({ balance: newBalance, transactions: [txn, ...transactions] });
      },

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'chopquick-wallet',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the display values — sync state should reset on each boot
      partialize: (state) => ({
        balance: state.balance,
        transactions: state.transactions,
      }),
    }
  )
);