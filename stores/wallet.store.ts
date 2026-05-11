// Wallet store — manages balance and transaction history
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MOCK_TRANSACTIONS } from '@/constants/mockData';
import type { Transaction } from '@/types';

interface WalletState {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  setBalance: (balance: number) => void;
  debit: (amount: number, description: string) => void;
  credit: (amount: number, description: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 12000,
      transactions: MOCK_TRANSACTIONS,
      isLoading: false,

      setBalance: (balance) => set({ balance }),

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

      reset: () => set({ balance: 0, transactions: [] }),
    }),
    {
      name: 'chopquick-wallet',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
