import { ENDPOINTS } from './endpoints';
import type { FxSnapshot } from '@/types/currency';

export async function fetchFxRates(base = 'USD', signal?: AbortSignal): Promise<FxSnapshot | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ENDPOINTS.timeoutMs);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(ENDPOINTS.fxLatest(base), { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j?.rates) return null;
    return { base: String(j.base ?? base), date: String(j.date ?? new Date().toISOString().slice(0, 10)), rates: j.rates, source: 'exchangerate.host' };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}