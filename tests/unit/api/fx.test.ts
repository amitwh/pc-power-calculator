import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fetchFxRates } from '@/lib/api/fx';

describe('fetchFxRates', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  test('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect(await fetchFxRates('USD')).toBeNull();
  });
  test('parses exchangerate.host response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ base: 'USD', date: '2026-09-15', rates: { INR: 83.5 } }) }));
    const r = await fetchFxRates('USD');
    expect(r?.rates.INR).toBe(83.5);
  });
});