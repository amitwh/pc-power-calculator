import { useMemo } from 'react';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import type { FxSnapshot } from '@/types/currency';

/**
 * Bundled FX snapshot only.
 *
 * Live FX (network fetch on mount) was removed for privacy reasons: every
 * visitor was hitting a third-party exchange-rate API without their
 * consent. The bundled snapshot ships with the app and is refreshed
 * manually as part of the data-freshness workflow.
 *
 * Live FX is intentionally deferred to a post-launch enhancement gated
 * behind explicit user consent (e.g. an opt-in button next to the tariff
 * source indicator). When added, this hook can grow a `refresh()` method
 * that callers trigger from a click handler.
 */
export function useFx(): { snapshot: FxSnapshot; isLive: false } {
  const snapshot = useMemo(() => getBundledFxSnapshot(), []);
  return { snapshot, isLive: false };
}
