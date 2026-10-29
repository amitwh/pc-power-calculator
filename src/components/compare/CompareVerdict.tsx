import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { computeEnergy, resolveBuildComponents } from '@/lib/calc/energy';
import { coercePsuRating, psuWattageFromSpecs, recommendPsuW } from '@/lib/calc/psu';
import { systemPowerW } from '@/lib/calc/power';
import { currencyForLocation } from '@/lib/data/tariffs';
import { convertCurrency } from '@/lib/data/fx';
import { listWorkloads } from '@/lib/data/workloads';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { emojiFor } from '@/lib/buildCategory';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo, FxSnapshot } from '@/types/currency';

interface Props {
  builds: BuildConfig[];
  /** Display currency for all money figures (the active build's currency). */
  displayCurrency: CurrencyInfo;
  fxSnapshot: FxSnapshot;
}

interface BuildStats {
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

function buildStats(b: BuildConfig, displayCurrency: CurrencyInfo, fxSnapshot: FxSnapshot): BuildStats {
  const workloads = listWorkloads();
  const { total } = computeEnergy(b, workloads, 'year', b.location.manual_rate_override ?? undefined);

  const comps = resolveBuildComponents(b);
  const distinct = new Set(comps.map((c) => c.id));
  const psu = comps.find((c) => c.category === 'psu');
  const rating = psu ? coercePsuRating(String(psu.specs.rating ?? psu.specs.efficiency ?? '')) : null;
  const wattage = psu ? psuWattageFromSpecs(psu.specs) ?? 650 : 650;
  const { wallDrawW: peak } = systemPowerW(comps, { cpu: 1, gpu: 1, ram: 1, storage: 1 }, rating, wattage);

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
    recommendedPsuW: recommendPsuW(peak),
    installedPsuW: psu ? psuWattageFromSpecs(psu.specs) : null,
    deviceCount: distinct.size,
  };
}

/** Stat tiles + a savings verdict for the compared systems. */
export function CompareVerdict({ builds, displayCurrency, fxSnapshot }: Props) {
  const stats = useMemo(
    () => builds.map((b) => buildStats(b, displayCurrency, fxSnapshot)),
    [builds, displayCurrency, fxSnapshot],
  );

  if (stats.length < 2) return null;
  const [a, b] = stats;

  // Cheapest to RUN = lowest yearly cost; kWh decides when costs are equal.
  const cheaper = b.costYear !== a.costYear ? (b.costYear < a.costYear ? b : a) : (b.kwhYear < a.kwhYear ? b : a);
  const pricier = cheaper.id === a.id ? b : a;
  const kwhSaved = pricier.kwhYear - cheaper.kwhYear;
  const costSaved = pricier.costYear - cheaper.costYear;
  const pct = pricier.kwhYear > 0 ? Math.round((kwhSaved / pricier.kwhYear) * 100) : 0;

  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.id} className="border border-gray-200 dark:border-gray-800 rounded-8 p-3">
            <div className="font-body font-bold text-sm text-gray-900 dark:text-gray-50 flex items-center gap-1.5 mb-2">
              <span aria-hidden>{emojiFor(s.category)}</span>
              {s.name}
              {s.id === cheaper.id && (
                <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5">
                  cheaper to run
                </span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm font-numeric tabular-nums">
              <dt className="text-gray-500">Energy/yr</dt>
              <dd className="font-semibold text-right">{formatKwh(s.kwhYear, 0)}</dd>
              <dt className="text-gray-500">Cost/yr{s.converted ? ' ≈' : ''}</dt>
              <dd className="font-semibold text-right text-brand-text">{formatCost(s.costYear, displayCurrency)}</dd>
              <dt className="text-gray-500">Peak draw</dt>
              <dd className="text-right">{Math.round(s.peakWallDrawW)} W</dd>
              <dt className="text-gray-500">PSU needed</dt>
              <dd className="text-right">
                {s.recommendedPsuW} W
                {s.installedPsuW != null && (
                  <span className={s.installedPsuW >= s.recommendedPsuW ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {' '}({s.installedPsuW} W installed)
                  </span>
                )}
              </dd>
              <dt className="text-gray-500">Devices</dt>
              <dd className="text-right">{s.deviceCount}</dd>
            </dl>
          </div>
        ))}
      </div>

      <div
        className={`mt-3 rounded-8 p-3 text-sm font-semibold ${
          cheaper.costYear < pricier.costYear
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }`}
      >
        {kwhSaved > 0 || costSaved > 0 ? (
          <>
            🏆 {cheaper.name} is the cheaper run — it saves{' '}
            <span className="font-numeric tabular-nums">{formatKwh(Math.max(kwhSaved, 0), 0)}</span> and{' '}
            <span className="font-numeric tabular-nums">{formatCost(Math.max(costSaved, 0), displayCurrency)}</span> per
            year ({pct}% less energy) than {pricier.name}.
            {cheaper.converted || pricier.converted
              ? ' Costs converted to the display currency at bundled FX rates.'
              : ''}
          </>
        ) : (
          <>⚖️ {a.name} and {b.name} cost about the same to run.</>
        )}
      </div>
    </Card>
  );
}
