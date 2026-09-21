import { ENDPOINTS } from './endpoints';

export async function detectLocation(signal?: AbortSignal): Promise<{ country_iso2: string; subdivision?: string } | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ENDPOINTS.timeoutMs);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(ENDPOINTS.geoIp, { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j?.country) return null;
    const subCode = j['subdivision (ISO 3166-2)'];
    return {
      country_iso2: String(j.country).toUpperCase(),
      subdivision: subCode ? `${String(j.country).toUpperCase()}-${String(subCode).toUpperCase()}` : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}