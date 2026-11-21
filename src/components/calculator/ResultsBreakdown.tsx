import { lazy, Suspense, useMemo } from 'react';
import { useCalc } from '@/hooks/useCalc';
import { listWorkloads, workloadLabel } from '@/lib/data/workloads';
import { computeEnergy } from '@/lib/calc/energy';
import { categoryColor } from '@/lib/categoryColors';
import { CASE_FANS_ID } from '@/lib/calc/energy';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { hasSelectedParts } from '@/lib/build/hasSelectedParts';
import { DeferInView } from '@/components/ui/DeferInView';
import type { Component } from '@/types/component';

// ApexCharts is heavy — defer the chart bundle until this card actually
// renders. Keeps the Home route's first paint small and helps Lighthouse.
const PowerBreakdown = lazy(() =>
  import('@/components/charts/PowerBreakdown').then((m) => ({ default: m.PowerBreakdown })),
);

/** Full-width row: per-device draw chart + per-workload usage/cost table. */
export function ResultsBreakdown() {
  const { build, components, componentsPowerW, currency } = useCalc();

  // Yearly energy and cost per use case. `daily` would be the wrong basis for a
  // "kWh/yr · ₹/yr" table — the figures are a day's worth, 365× too small.
  const yearlyRows = useMemo(() => {
    if (!build) return [];
    return computeEnergy(build, listWorkloads(), 'year').perWorkload;
  }, [build]);

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

  // With no parts selected there is no meaningful breakdown: a zero-slice
  // donut and a "4 W" PSU/peak figure read as broken rather than empty. The
  // results panel above already carries the one prompt, so this renders
  // nothing at all instead of a second, near-identical empty card.
  if (!hasSelectedParts(build)) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 min-w-0">
      <Card>
        <CardTitle className="text-base">Where the power goes</CardTitle>
        <p className="text-xs text-gray-500 -mt-1 mb-1">
          Typical 70% load, per device — colours match the system list.
        </p>
        {/* Below the fold on most screens — DeferInView keeps the ~900 KB
            chart chunk from loading until the visitor scrolls near it. */}
        <DeferInView>
          <Suspense fallback={<div className="h-[260px] flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">Loading chart...</div>}>
            <PowerBreakdown components={chartComponents} drawWByComponentId={componentsPowerW} qtyById={qtyById} colors={chartColors} />
          </Suspense>
        </DeferInView>
      </Card>

      <Card>
        <CardTitle className="text-base">Cost by use case</CardTitle>
        <p className="text-xs text-gray-500 -mt-1 mb-2">
          From your schedule above · costs in {currency.code}.
        </p>
        {yearlyRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-numeric tabular-nums">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                  <th className="py-1.5 pr-3 font-semibold">Use case</th>
                  <th className="py-1.5 pr-3 font-semibold">Hours</th>
                  <th className="py-1.5 pr-3 text-right font-semibold">kWh/yr</th>
                  <th className="py-1.5 pr-0 text-right font-semibold">{currency.symbol}/yr</th>
                </tr>
              </thead>
              <tbody>
                {yearlyRows.map((row) => {
                  const sched = build.schedule.find((s) => s.workload_id === row.workload_id);
                  const days = sched?.days_per_week ?? 7;
                  return (
                    <tr key={row.workload_id} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
                      <td className="py-1.5 pr-3 font-body">{workloadLabel(row.workload_id)}</td>
                      <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-400">
                        {sched
                          ? `${sched.hours_per_day} h/d · ${days} d/wk`
                          : row.workload_id === 'idle'
                            ? `${row.hours_per_day} h/d · every day`
                            : '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{formatKwh(row.kwh, 0)}</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums">
                        {formatCost(row.cost, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Add a use case to the schedule above to see per-task energy and cost.
          </p>
        )}
      </Card>
    </div>
  );
}
