import { lazy, Suspense, useMemo } from 'react';
import { useCalc } from '@/hooks/useCalc';
import { listWorkloads } from '@/lib/data/workloads';
import { categoryColor } from '@/lib/categoryColors';
import { CASE_FANS_ID } from '@/lib/calc/energy';
import { Card, CardTitle } from '@/components/ui/Card';
import type { Component } from '@/types/component';

// ApexCharts is heavy — defer the chart bundle until this card actually
// renders. Keeps the Home route's first paint small and helps Lighthouse.
const PowerBreakdown = lazy(() =>
  import('@/components/charts/PowerBreakdown').then((m) => ({ default: m.PowerBreakdown })),
);

/** Full-width row: per-device draw chart + per-workload usage/cost table. */
export function ResultsBreakdown() {
  const { build, components, componentsPowerW, daily, currency } = useCalc();

  const workloadMap = useMemo(() => new Map(listWorkloads().map((w) => [w.id, w])), []);

  // `components` repeats each unit (qty ×N) — the chart wants one slice per
  // distinct device with the combined draw and a ×N label.
  const { chartComponents, qtyById, chartColors } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of components) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
    const seen = new Set<string>();
    const unique: Component[] = [];
    for (const c of components) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        unique.push(c);
      }
    }
    return {
      chartComponents: unique,
      qtyById: Object.fromEntries(counts),
      // The synthetic case-fans aggregate reads as a fan, not a peripheral.
      chartColors: unique.map((c) =>
        categoryColor(c.id === CASE_FANS_ID ? 'fan' : c.category).hex,
      ),
    };
  }, [components]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0">
      <Card>
        <CardTitle className="text-base">Power draw breakdown</CardTitle>
        <p className="text-xs text-gray-500 -mt-1 mb-1">
          Typical 70% load, per device — colors match the device list.
        </p>
        <Suspense fallback={<div className="h-[260px] flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">Loading chart...</div>}>
          <PowerBreakdown components={chartComponents} drawWByComponentId={componentsPowerW} qtyById={qtyById} colors={chartColors} />
        </Suspense>
      </Card>

      <Card>
        <CardTitle className="text-base">Per-workload usage &amp; performance</CardTitle>
        <p className="text-xs text-gray-500 -mt-1 mb-2">
          From your schedule above · costs in {currency.code}.
        </p>
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
          <p className="text-sm text-gray-500">
            Add workloads to the schedule above to see per-task energy and cost.
          </p>
        )}
      </Card>
    </div>
  );
}
