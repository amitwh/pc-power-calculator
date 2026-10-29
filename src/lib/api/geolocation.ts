import { ENDPOINTS } from './endpoints';

interface GeoResponse {
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
}

/**
 * Resolve the visitor's location from their IP, trying ipapi.co first and
 * ipwho.is as a fallback (both free, keyless, HTTPS).
 *
 * ipapi.co responses use `country` (ISO 3166-1 alpha-2) + `region_code`
 * (e.g. "KL"); ipwho.is uses `country_code` + `region_code`. Older builds
 * parsed a `'subdivision (ISO 3166-2)'` field that neither provider returns,
 * which is why state-level tariff capture never fired.
 */
export async function detectLocation(signal?: AbortSignal): Promise<{ country_iso2: string; subdivision?: string } | null> {
  const ipapi = await tryProvider(ENDPOINTS.geoIp, (j: GeoResponse) => {
    const country = j.country ?? j.country_code;
    return country ? { country, region_code: j.region_code ?? j.region } : null;
  }, signal);
  if (ipapi) return ipapi;
  return tryProvider(ENDPOINTS.geoIpFallback, (j: GeoResponse) => {
    const country = j.country_code ?? j.country;
    return country ? { country, region_code: j.region_code ?? j.region } : null;
  }, signal);
}

async function tryProvider(
  url: string,
  parse: (j: GeoResponse) => { country: string; region_code?: string } | null,
  signal?: AbortSignal,
): Promise<{ country_iso2: string; subdivision?: string } | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ENDPOINTS.timeoutMs);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = await res.json();
    const parsed = parse(j);
    if (!parsed) return null;
    const country = parsed.country.toUpperCase();
    const sub = parsed.region_code?.trim().toUpperCase();
    // Provider region codes are the ISO 3166-2 suffix (e.g. "KL"); some
    // responses carry the full code ("IN-KL") — normalize both.
    const subdivision = sub
      ? sub.includes('-') ? sub : `${country}-${sub}`
      : undefined;
    return { country_iso2: country, subdivision };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
    signal?.removeEventListener('abort', onAbort);
  }
}
