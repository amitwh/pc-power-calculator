import { computeEnergy, resolveBuildComponents } from '@/lib/calc/energy';
import { coercePsuRating, psuWattageFromSpecs, recommendPsuW } from '@/lib/calc/psu';
import { systemPowerW } from '@/lib/calc/power';
import { currencyForLocation } from '@/lib/data/tariffs';
import { convertCurrency } from '@/lib/data/fx';
import { listWorkloads } from '@/lib/data/workloads';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo, FxSnapshot } from '@/types/currency';

export interface BuildStats {
  id: string;
  name: string;
  category?: BuildConfig['category'];
  kwhYear: number;
  costYear: number;
  /** True when costYear had to be FX-converted into the display currency. */
  converted: boolean;
  peakWallDrawW: number;
  recommendedPsuW: number;
  installedPsuW: number | null;
  deviceCount: number;
}

export function buildStats(b: BuildConfig, displayCurrency: CurrencyInfo, fxSnapshot: FxSnapshot): BuildStats {
  const workloads = listWorkloads();
  const { total } = computeEnergy(b, workloads, 'year', b.location.manual_rate_override ?? undefined);

  const comps = resolveBuildComponents(b);
  const distinct = new Set(comps.map((c) => c.id));
  const psu = comps.find((c) => c.category === 'psu');
  const rating = psu ? coercePsuRating(String(psu.specs.rating ?? psu.specs.efficiency ?? '')) : null;
  const wattage = psu ? psuWattageFromSpecs(psu.specs) ?? 650 : 650;
  // Size the PSU from PSU-side draw only — monitors are wall-powered and must
  // not inflate the recommendation (same rule as useCalc).
  const { componentDrawW: peakComponentDrawW, wallDrawW: peak } = systemPowerW(
    comps,
    { cpu: 1, gpu: 1, ram: 1, storage: 1 },
    rating,
    wattage,
  );

  const own = currencyForLocation(b.location.country_iso2, b.location.subdivision_code, b.currency_override);
  const converted = own.code !== displayCurrency.code;
  const convertedCost = converted
    ? convertCurrency(total.cost, own.code, displayCurrency.code, fxSnapshot)
    : total.cost;

  return {
    id: b.id,
    name: b.name,
    category: b.category,
    kwhYear: total.kwh,
    costYear: convertedCost ?? total.cost,
    converted: converted && convertedCost != null,
    peakWallDrawW: peak,
    recommendedPsuW: recommendPsuW(peakComponentDrawW),
    installedPsuW: psu ? psuWattageFromSpecs(psu.specs) : null,
    deviceCount: distinct.size,
  };
}
