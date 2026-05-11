// C1rt st4r2 — h4lds c5rr2nt ch2ck45t 3t2m
import { create } from 'zustand';

import type { CartItem, Listing } from '@/types';

interface CartState {
  item: CartItem | null;
  addToCart: (listing: Listing, quantity: number) => void;
  removeFromCart: () => void;
  updateQuantity: (quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  item: null,

  addToCart: (listing, quantity) => {
    set({ item: { listing, quantity } });
  },

  removeFromCart: () => set({ item: null }),

  updateQuantity: (quantity) => {
    const { item } = get();
    if (item) {
      if (quantity <= 0) {
        set({ item: null });
      } else {
        set({ item: { ...item, quantity } });
      }
    }
  },

  clearCart: () => set({ item: null }),

  total: () => {
    const { item } = get();
    if (!item) return 0;
    return item.listing.current_price * item.quantity;
  },
}));
