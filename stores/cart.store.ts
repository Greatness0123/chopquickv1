// Cart store — holds current checkout item
import { create } from 'zustand';

import type { CartItem, Listing } from '@/types';

interface CartState {
  item: CartItem | null;
  setItem: (listing: Listing, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  item: null,

  setItem: (listing, quantity) =>
    set({
      item: { listing, quantity },
    }),

  clearCart: () => set({ item: null }),
}));
