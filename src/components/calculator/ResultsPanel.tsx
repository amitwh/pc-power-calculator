import { lazy, Suspense, useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { computeEnergy } from '@/lib/calc/energy';
import { listWorkloads } from '@/lib/data/workloads';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { ExportMenu } from './ExportMenu';
import { emojiFor } from '@/lib/buildCategory';
import type { CurrencyInfo } from '@/types/currency';
import type { Workload } from '@/types/workload';

// ApexCharts is heavy — defer the chart bundle until the ResultsPanel actually
// renders it. Keeps the Home route's first paint small and helps Lighthouse.
const PowerBreakdown = lazy(() =>
  import('@/components/charts/PowerBreakdown').then((m) => ({ default: m.PowerBreakdown })),
);

const INR: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 2 };

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
  const { build, components, componentsPowerW, daily, monthly, yearly, allYearly, allDaily, allMonthly } = useCalc();

  const summary = useMemo(() => {
    const workloads = listWorkloads();
    return builds.map((b) => {
      const rate = b.location.manual_rate_override;
      const yr = computeEnergy(b, workloads, 'year', rate).total;
      const meta = buildMeta(b.schedule, workloads);
      return {
        id: b.id,
        name: b.name,
        category: b.category,
        kwh: yr.kwh,
        cost: yr.cost,
        meta,
      };
    });
  }, [builds]);

  return (
    <Card>
      <CardTitle>
        <span>
          <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-brand text-white text-sm font-bold">
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
            <div className={`font-semibold text-lg ${row.primary ? 'text-white' : 'text-brand'}`}>
              {formatCost(row.cost, INR)}
            </div>
            <div className={`text-xs mt-1 ${row.primary ? 'text-white/85' : 'text-gray-500'}`}>{row.sub}</div>
          </div>
        ))}
      </div>

      {/* Power draw breakdown */}
      <div className="mt-5">
        <div className="text-xs uppercase text-gray-500 mb-2 font-semibold">
          Power draw breakdown (typical 70% load)
        </div>
        <Suspense fallback={<div className="h-[260px] flex items-center justify-center text-sm text-gray-400">Loading chart...</div>}>
          <PowerBreakdown components={components} drawWByComponentId={componentsPowerW} />
        </Suspense>
      </div>

      {/* Per-workload performance — FPS, render seconds, hashrate, etc. */}
      <div className="mt-4">
        <div className="text-xs uppercase text-gray-500 mb-2 font-semibold">Per-workload performance</div>
        <ul className="text-sm space-y-1">
          {daily.perWorkload?.map((row) => (
            <li key={row.workload_id} className="flex justify-between font-numeric tabular-nums">
              <span>{row.workload_id}</span>
              <span>{row.perfMetrics.map((m) => `${m.value}${m.unit}`).join(' · ') || '—'}</span>
            </li>
          ))}
        </ul>
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
                <div className="font-numeric text-base font-semibold text-brand tabular-nums">
                  {formatCost(row.cost, INR)}/yr
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
              <div className="text-sm text-gray-500">Total annual cost</div>
              <div className="font-display text-3xl font-bold text-brand">
                {formatCost(allYearly.cost, INR)}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 font-numeric tabular-nums">
            Daily: {formatKwh(allDaily.kwh, 1)} · {formatCost(allDaily.cost, INR)} · Monthly: {formatKwh(allMonthly.kwh, 0)} ·{' '}
            {formatCost(allMonthly.cost, INR)}
          </div>
        </div>
      )}
    </Card>
  );
}
