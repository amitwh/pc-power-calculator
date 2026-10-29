import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { computeEnergy } from '@/lib/calc/energy';
import { currencyForLocation } from '@/lib/data/tariffs';
import { listWorkloads } from '@/lib/data/workloads';
import { Card } from '@/components/ui/Card';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { emojiFor } from '@/lib/buildCategory';
import type { Workload } from '@/types/workload';

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

/** Full-width card comparing every saved system's yearly energy and cost. */
export function AllSystemsSummary() {
  const builds = useBuildStore((s) => s.builds);
  const { allYearly, allDaily, allMonthly, currency } = useCalc();

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

  if (summary.length === 0) return null;

  return (
    <Card>
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
          <div className="font-display text-3xl font-bold text-brand-text">
            {formatCost(allYearly.cost, currency)}
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 font-numeric tabular-nums">
        Daily: {formatKwh(allDaily.kwh, 1)} · {formatCost(allDaily.cost, currency)} · Monthly: {formatKwh(allMonthly.kwh, 0)} ·{' '}
        {formatCost(allMonthly.cost, currency)}
      </div>
    </Card>
  );
}
