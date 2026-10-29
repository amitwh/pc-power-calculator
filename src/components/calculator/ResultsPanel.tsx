import { lazy, Suspense, useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { computeEnergy } from '@/lib/calc/energy';
import { currencyForLocation } from '@/lib/data/tariffs';
import { listWorkloads } from '@/lib/data/workloads';
import { listComponents } from '@/lib/data/components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { ExportMenu } from './ExportMenu';
import { emojiFor } from '@/lib/buildCategory';
import type { Workload } from '@/types/workload';

// ApexCharts is heavy — defer the chart bundle until the ResultsPanel actually
// renders it. Keeps the Home route's first paint small and helps Lighthouse.
const PowerBreakdown = lazy(() =>
  import('@/components/charts/PowerBreakdown').then((m) => ({ default: m.PowerBreakdown })),
);

function buildMeta(
  schedule: ReadonlyArray<{ workload_id: string; hours_per_day: number }>,
  workloads: Workload[],
): string {
  const map = new Map(workloads.map((w) => [w.id, w]));
  const lines = schedule
    .filter((s) => s.hours_per_day > 0)
    .map((s) => {
      const wl = map.get(s.workload_id as Workload['id']);
      const name = wl?.name ?? s.workload_id;
      return `${s.hours_per_day} h ${name.toLowerCase()}`;
    });
  return lines.length > 0 ? lines.join(' · ') : 'idle';
}

export function ResultsPanel() {
  const builds = useBuildStore((s) => s.builds);
  const setComponent = useBuildStore((s) => s.setComponent);
  const { build, components, componentsPowerW, daily, monthly, yearly, allYearly, allDaily, allMonthly, psuWattage, peakWallDrawW, recommendedPsuW, currency } = useCalc();

  const workloadMap = useMemo(() => new Map(listWorkloads().map((w) => [w.id, w])), []);

  /** Closest catalog PSU at or above the recommendation (Generic first). */
  const pickRecommendedPsu = () => {
    const psus = listComponents('psu').filter((p) => Number(p.specs.wattage_w) > 0);
    const byWatt = (p: (typeof psus)[number]) => Number(p.specs.wattage_w);
    const exact = psus.filter((p) => byWatt(p) === recommendedPsuW);
    const up = psus.filter((p) => byWatt(p) >= recommendedPsuW).sort((a, b) => byWatt(a) - byWatt(b));
    const pick =
      exact.find((p) => p.brand === 'Generic') ??
      exact[0] ??
      up.find((p) => p.brand === 'Generic') ??
      up[0] ??
      psus.sort((a, b) => byWatt(b) - byWatt(a))[0];
    if (pick) setComponent('psu', pick.id);
  };

  const summary = useMemo(() => {
    const workloads = listWorkloads();
    return builds.map((b) => {
      const yr = computeEnergy(b, workloads, 'year', b.location.manual_rate_override ?? undefined).total;
      const meta = buildMeta(b.schedule, workloads);
      return {
        id: b.id,
        name: b.name,
        category: b.category,
        kwh: yr.kwh,
        cost: yr.cost,
        meta,
        currency: currencyForLocation(b.location.country_iso2, b.location.subdivision_code, b.currency_override),
      };
    });
  }, [builds]);

  return (
    <Card>
      <CardTitle>
        <span>
          <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-brand-dark text-white text-sm font-bold">
            4
          </span>
          Results — {build.name}
        </span>
      </CardTitle>

      {/* Daily / Monthly / Yearly totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-numeric tabular-nums">
        {[
          { label: 'Daily',   kwh: daily.kwh,   cost: daily.cost,   sub: 'avg over 24 h schedule', primary: false },
          { label: 'Monthly', kwh: monthly.kwh, cost: monthly.cost, sub: '× 30.44 days',            primary: false },
          { label: 'Yearly',  kwh: yearly.kwh,  cost: yearly.cost,  sub: '× 365.25 days',           primary: true },
        ].map((row) => (
          <div
            key={row.label}
            className={`border rounded-8 p-3 ${
              row.primary
                ? 'bg-gradient-to-br from-brand to-brand-dark text-white border-transparent'
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className={`text-xs uppercase font-semibold ${row.primary ? 'text-white/85' : 'text-gray-500'}`}>
              {row.label}
            </div>
            <div className="font-display text-2xl font-bold mt-1">{formatKwh(row.kwh, 1)}</div>
            <div className={`font-semibold text-lg ${row.primary ? 'text-white' : 'text-brand-text'}`}>
              {formatCost(row.cost, currency)}
            </div>
            <div className={`text-xs mt-1 ${row.primary ? 'text-white/85' : 'text-gray-500'}`}>{row.sub}</div>
          </div>
        ))}
      </div>

      {/* PSU sizing guidance */}
      <div className="mt-5 border rounded-8 p-3 border-gray-200 dark:border-gray-800">
        <div className="text-xs uppercase text-gray-500 mb-2 font-semibold">PSU recommendation</div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-numeric tabular-nums text-sm">
          <span>
            Peak draw (all components at 100%):{' '}
            <strong className="font-display">{Math.round(peakWallDrawW)} W</strong>
          </span>
          <span>
            Recommended PSU: <strong className="font-display text-brand-text">{recommendedPsuW} W</strong>
          </span>
          {psuWattage != null && psuWattage >= recommendedPsuW && (
            <span className="text-green-700 dark:text-green-400 font-semibold">
              ✓ Your {psuWattage} W PSU has enough headroom
            </span>
          )}
          {psuWattage != null && psuWattage < recommendedPsuW && (
            <>
              <span className="text-red-600 dark:text-red-400 font-semibold">
                ⚠ Your {psuWattage} W PSU is undersized
              </span>
              <Button size="sm" variant="secondary" onClick={pickRecommendedPsu}>
                Pick a {recommendedPsuW} W PSU for me
              </Button>
            </>
          )}
          {psuWattage == null && (
            <>
              <span className="text-gray-500">No PSU selected (35% safety margin included)</span>
              <Button size="sm" variant="secondary" onClick={pickRecommendedPsu}>
                Pick a {recommendedPsuW} W PSU for me
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Power draw breakdown */}
      <div className="mt-5">
        <div className="text-xs uppercase text-gray-500 mb-2 font-semibold">
          Power draw breakdown (typical 70% load)
        </div>
        <Suspense fallback={<div className="h-[260px] flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">Loading chart...</div>}>
          <PowerBreakdown components={components} drawWByComponentId={componentsPowerW} />
        </Suspense>
      </div>

      {/* Per-workload performance + usage — FPS, render seconds, hashrate, etc. */}
      <div className="mt-4">
        <div className="text-xs uppercase text-gray-500 mb-2 font-semibold">
          Per-workload usage &amp; performance
        </div>
        {daily.perWorkload?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-numeric tabular-nums">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <th className="py-1.5 pr-3 font-semibold">Workload</th>
                  <th className="py-1.5 pr-3 font-semibold">Usage</th>
                  <th className="py-1.5 pr-3 font-semibold">Draw</th>
                  <th className="py-1.5 pr-3 font-semibold">Perf</th>
                </tr>
              </thead>
              <tbody>
                {daily.perWorkload.map((row) => {
                  const wl = workloadMap.get(row.workload_id);
                  const sched = build.schedule.find((s) => s.workload_id === row.workload_id);
                  const days = sched?.days_per_week ?? 7;
                  return (
                    <tr key={row.workload_id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <td className="py-1.5 pr-3 font-body">{wl?.name ?? row.workload_id}</td>
                      <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-400">
                        {sched ? `${sched.hours_per_day} h/d · ${days} d/wk` : '—'}
                      </td>
                      <td className="py-1.5 pr-3">{Math.round(row.draw_w)} W</td>
                      <td className="py-1.5 pr-3">
                        {row.perfMetrics.map((m) => `${m.value}${m.unit}`).join(' · ') || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Add workloads in the schedule above to see per-task numbers.</p>
        )}
      </div>

      {/* Export menu — PDF (window.print) and HTML (re-importable) */}
      <ExportMenu />

      {/* Multi-system summary */}
      {summary.length > 0 && (
        <div className="mt-6 p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 border border-gray-200 dark:border-gray-800 rounded-12">
          <h3 className="font-display text-base font-bold mb-3 text-gray-900 dark:text-gray-50">
            📊 All your systems at a glance
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((row) => (
              <div
                key={row.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-8 p-3"
              >
                <div className="font-body font-bold text-sm text-gray-900 dark:text-gray-50 mb-1.5 flex items-center gap-1.5">
                  <span aria-hidden>{emojiFor(row.category)}</span>
                  {row.name}
                </div>
                <div className="font-display text-xl font-bold text-gray-900 dark:text-gray-50 tabular-nums">
                  {formatKwh(row.kwh, 0)}/yr
                </div>
                <div className="font-numeric text-base font-semibold text-brand-text tabular-nums">
                  {formatCost(row.cost, row.currency)}/yr
                </div>
                <div className="font-body text-xs text-gray-500 mt-1">{row.meta}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap justify-between items-center gap-3">
            <div className="font-numeric tabular-nums">
              <div className="text-sm text-gray-500">All systems combined</div>
              <div className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50">
                {formatKwh(allYearly.kwh, 0)}/yr
              </div>
            </div>
            <div className="font-numeric tabular-nums text-right">
              <div className="text-sm text-gray-500">
                Total annual cost{summary.some((r) => r.currency.code !== currency.code) ? ' (active build currency)' : ''}
              </div>
              <div className="font-display text-3xl font-bold text-brand">
                {formatCost(allYearly.cost, currency)}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 font-numeric tabular-nums">
            Daily: {formatKwh(allDaily.kwh, 1)} · {formatCost(allDaily.cost, currency)} · Monthly: {formatKwh(allMonthly.kwh, 0)} ·{' '}
            {formatCost(allMonthly.cost, currency)}
          </div>
        </div>
      )}
    </Card>
  );
}
