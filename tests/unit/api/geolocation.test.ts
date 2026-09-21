import { describe, expect, test, vi, beforeEach } from 'vitest';
import { detectLocation } from '@/lib/api/geolocation';

describe('detectLocation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  test('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    const r = await detectLocation(new AbortController().signal);
    expect(r).toBeNull();
  });
  test('returns null on timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((_r, reject) => setTimeout(() => reject(new Error('timeout')), 5000))));
    const r = await detectLocation(AbortSignal.timeout(50));
    expect(r).toBeNull();
  }, 10_000);
  test('parses ipapi.co response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ country: 'IN', 'subdivision (ISO 3166-2)': 'KL' }) }));
    const r = await detectLocation();
    expect(r).toEqual({ country_iso2: 'IN', subdivision: 'IN-KL' });
  });
  test('returns null on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const r = await detectLocation();
    expect(r).toBeNull();
  });
});