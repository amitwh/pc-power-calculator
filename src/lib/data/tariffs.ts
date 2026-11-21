import data from '@/data/tariffs.json';
import type { TariffRate, TariffSchedule, TaxRule } from '@/types/tariff';
import type { CurrencyInfo } from '@/types/currency';
import { findCurrency } from './currencies';

const list = (data as unknown as { countries: TariffSchedule[] }).countries;

export function listCountries(): Array<{ iso2: string; name: string; hasSubdivisions: boolean }> {
  return list.map((c) => ({
    iso2: c.country_iso2,
    name: c.country_name,
    hasSubdivisions: Boolean(c.subdivisions?.length),
  }));
}

export function findTariff(iso2: string, subdivisionCode?: string): TariffSchedule | undefined {
  const c = list.find((x) => x.country_iso2 === iso2);
  if (!c) return undefined;
  if (subdivisionCode && c.subdivisions) {
    const sub = c.subdivisions.find((s) => s.code === subdivisionCode);
    if (sub) {
      return {
        ...c,
        subdivisions: undefined,
        default: sub.rate,
        notes: c.notes ? `${c.notes} (rate for ${sub.name})` : `Rate for ${sub.name}`,
      };
    }
  }
  return c;
}

export function effectiveRateForCountry(iso2: string, subdivisionCode?: string): TariffRate {
  const t = findTariff(iso2, subdivisionCode);
  return t?.default ?? { currency: 'USD', flat: 0.10 };
}

export function listSubdivisions(iso2: string): Array<{ code: string; name: string }> {
  const c = list.find((x) => x.country_iso2 === iso2);
  return (c?.subdivisions ?? []).map((s) => ({ code: s.code, name: s.name }));
}

/** Provenance for a country's rate: source, date, and whether it is an estimate. */
export function tariffProvenance(iso2: string): {
  source?: string;
  updated?: string;
  estimated: boolean;
} {
  const c = list.find((x) => x.country_iso2 === iso2);
  return {
    source: c?.rateSource,
    updated: c?.rateUpdated,
    // Unknown countries are, by definition, not verified.
    estimated: c?.rateEstimated ?? true,
  };
}

export function tariffsLastUpdated(): string {
  return (data as { lastUpdated: string }).lastUpdated;
}

/**
 * The caveat attached to a location: the subdivision's own note when it has
 * one (e.g. the MSEDCL slab caveat for Maharashtra), otherwise the country's.
 */
export function tariffNotes(iso2: string, subdivisionCode?: string): string | undefined {
  const c = list.find((x) => x.country_iso2 === iso2);
  if (!c) return undefined;
  if (subdivisionCode) {
    const sub = c.subdivisions?.find((s) => s.code === subdivisionCode);
    if (sub?.notes) return sub.notes;
  }
  return c.notes;
}

/** Bundled fallback when a country has no schedule entry. */
export const FALLBACK_TARIFF: TariffRate = { currency: 'USD', flat: 0.10 };

/** Rate + applicable taxes for a build location, from the bundled schedule. */
export function resolveLocationTariff(
  iso2: string,
  subdivisionCode?: string,
): { rate: TariffRate; taxes: TaxRule[] } {
  const t = findTariff(iso2, subdivisionCode);
  return { rate: t?.default ?? FALLBACK_TARIFF, taxes: t?.applicableTaxes ?? [] };
}

/**
 * The currency a build's money should be displayed in: the explicit override
 * wins, else the currency of the resolved tariff (so a US build shows $, an
 * Indian build ₹), else USD.
 */
export function currencyForLocation(
  iso2: string,
  subdivisionCode?: string,
  currencyOverride?: string,
): CurrencyInfo {
  const resolved = findCurrency(currencyOverride ?? '');
  if (resolved) return resolved;
  const { rate } = resolveLocationTariff(iso2, subdivisionCode);
  return findCurrency(rate.currency) ?? findCurrency('USD')!;
}
