import { create } from 'zustand';
import type { ComponentCategory } from '@/types/component';

export interface PickerState {
  /** The category the picker should open on, or null for the whole catalogue. */
  category: ComponentCategory | null;
  /** Bumped on every request, so the same category can be requested twice in a row. */
  nonce: number;
  request: (category: ComponentCategory) => void;
  clear: () => void;
}

/**
 * Transient hand-off between the answer hero and the parts picker.
 *
 * Its own store, deliberately not a field on `buildStore`: that one is
 * persisted to localStorage, and "the picker should open on PSUs" is throwaway
 * UI state. Writing it there would churn the visitor's saved build on every
 * open, so nothing in this store survives a reload.
 */
export const usePickerStore = create<PickerState>()((set) => ({
  category: null,
  nonce: 0,
  // The nonce is what subscribers watch: the category alone cannot tell
  // "open on PSUs" from "open on PSUs again".
  request: (category) => set((s) => ({ category, nonce: s.nonce + 1 })),
  clear: () => set({ category: null }),
}));
