import data from '@/data/fx_rates.json';
import type { FxSnapshot } from '@/types/currency';

const snapshot = (data as unknown as { snapshot: FxSnapshot }).snapshot;

export function getBundledFxSnapshot(): FxSnapshot {
  return snapshot;
}
