import data from '@/data/fx_rates.json';
import type { FxSnapshot } from '@/types/currency';

const snapshot = (data as unknown as { snapshot: FxSnapshot }).snapshot;

export function getBundledFxSnapshot(): FxSnapshot {
  return snapshot;
}

/** Exchange rate for a currency code against the snapshot base (1 = base). */
export function fxRateFor(snapshot: FxSnapshot, code: string): number | null {
  if (code === snapshot.base) return 1;
  const rate = snapshot.rates[code];
  return typeof rate === 'number' && rate > 0 ? rate : null;
}

/**
 * Convert an amount between two currencies using the bundled snapshot.
 * Returns null when either code is missing from the snapshot — callers
 * should fall back to showing the raw amount rather than 0.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  snapshot: FxSnapshot,
): number | null {
  const fromRate = fxRateFor(snapshot, from);
  const toRate = fxRateFor(snapshot, to);
  if (fromRate == null || toRate == null) return null;
  return (amount / fromRate) * toRate;
}
