import { create } from 'zustand';
import type { Listing } from '../types';

interface ListingStore {
  selected: Listing | null;
  setSelected: (listing: Listing) => void;
  clear: () => void;
}

export const useListingStore = create<ListingStore>((set) => ({
  selected: null,
  setSelected: (listing) => set({ selected: listing }),
  clear: () => set({ selected: null }),
}));