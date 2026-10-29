import { describe, expect, test, vi, beforeEach } from 'vitest';
import { detectLocation } from '@/lib/api/geolocation';
import { ENDPOINTS } from '@/lib/api/endpoints';

describe('detectLocation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  test('returns null on network error (both providers fail)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    const r = await detectLocation(new AbortController().signal);
    expect(r).toBeNull();
  });

  test('returns null on timeout', async () => {
    // Mock fetch honors the abort signal so the outer 50 ms timeout cuts both
    // providers off immediately (mirrors real fetch behavior).
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts?: { signal?: AbortSignal }) =>
      new Promise((_r, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), 5000);
        opts?.signal?.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')); });
      })));
    const r = await detectLocation(AbortSignal.timeout(50));
    expect(r).toBeNull();
  }, 10_000);

  test('parses the real ipapi.co response (country + region_code)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ip: '1.2.3.4', country: 'IN', country_name: 'India', region: 'Kerala', region_code: 'KL' }),
    }));
    const r = await detectLocation();
    expect(r).toEqual({ country_iso2: 'IN', subdivision: 'IN-KL' });
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(ENDPOINTS.geoIp);
  });

  test('accepts country_code when the provider omits country', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ country_code: 'DE', region_code: 'BY' }),
    }));
    const r = await detectLocation();
    expect(r).toEqual({ country_iso2: 'DE', subdivision: 'DE-BY' });
  });

  test('normalizes a full ISO 3166-2 region code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ country: 'IN', region_code: 'IN-KL' }),
    }));
    const r = await detectLocation();
    expect(r?.subdivision).toBe('IN-KL');
  });

  test('returns no subdivision when the provider omits the region', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ country: 'SG' }),
    }));
    const r = await detectLocation();
    expect(r).toEqual({ country_iso2: 'SG', subdivision: undefined });
  });

  test('falls back to ipwho.is when ipapi.co fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ error: true, reason: 'RateLimited' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, country_code: 'US', region: 'California', region_code: 'CA' }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const r = await detectLocation();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(ENDPOINTS.geoIpFallback);
    expect(r).toEqual({ country_iso2: 'US', subdivision: 'US-CA' });
  });

  test('returns null when both providers fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const r = await detectLocation();
    expect(r).toBeNull();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });
});
