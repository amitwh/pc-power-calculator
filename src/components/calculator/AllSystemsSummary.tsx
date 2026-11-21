import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { useFx } from '@/hooks/useFx';
import { computeEnergy } from '@/lib/calc/energy';
import { currencyForLocation } from '@/lib/data/tariffs';
import { convertCurrency } from '@/lib/data/fx';
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

/** Identity hues for system cards — faint by design, distinct at a glance. */
const SYSTEM_TINTS = ['#e5461f', '#2c7a9e', '#6a5acd', '#1a7a56', '#d97706', '#0f766e'];

/**
 * A build's hue comes from its id, not its position: deleting one system must
 * not repaint the others, and the same build keeps its colour across visits.
 */
function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return SYSTEM_TINTS[hash % SYSTEM_TINTS.length];
}

/** Full-width card comparing every saved system's yearly energy and cost. */
export function AllSystemsSummary() {
  const builds = useBuildStore((s) => s.builds);
  const { allDaily, allMonthly, currency } = useCalc();
  const { snapshot } = useFx();

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

  // Systems billing in a different currency are FX-converted before summing,
  // so the combined total no longer adds rupees to dollars. (kWh is
  // currency-independent, so energy sums directly.)
  const { combinedCost, combinedKwh, anyConverted } = useMemo(() => {
    let cost = 0;
    let kwh = 0;
    let converted = false;
    for (const row of summary) {
      kwh += row.kwh;
      if (row.currency.code === currency.code) {
        cost += row.cost;
        continue;
      }
      const c = convertCurrency(row.cost, row.currency.code, currency.code, snapshot);
      cost += c ?? row.cost;
      if (c != null) converted = true;
    }
    return { combinedCost: cost, combinedKwh: kwh, anyConverted: converted };
  }, [summary, currency.code, snapshot]);

  // With one build the results panel already shows the total; only the
  // multi-system comparison earns its own card.
  if (builds.length <= 1) return null;

  return (
    <Card>
      <h3 className="font-display text-base font-bold mb-3 text-gray-900 dark:text-gray-50">
        📊 All your systems at a glance
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map((row) => (
          <div
            key={row.id}
            // Each system keeps one faint hue for the whole page, derived from
            // its position in the list so it is stable across renders.
            style={{ '--tint': tintFor(row.id) } as CSSProperties}
            className="system-tint border border-l-[3px] border-gray-200 dark:border-gray-800 rounded-8 p-3"
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
            {formatKwh(combinedKwh, 0)}/yr
          </div>
        </div>
        <div className="font-numeric tabular-nums text-right">
          <div className="text-sm text-gray-500">
            Total annual cost{summary.some((r) => r.currency.code !== currency.code)
              ? ` ≈ (converted to ${currency.code}, FX ${snapshot.date})`
              : ''}
          </div>
          <div className="font-display text-3xl font-bold text-brand-text">
            {formatCost(combinedCost, currency)}
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 font-numeric tabular-nums">
        Daily: {formatKwh(allDaily.kwh, 1)} · Monthly: {formatKwh(allMonthly.kwh, 0)} ·{' '}
        {anyConverted && 'foreign-currency systems converted at bundled FX · '}
        Energy totals are currency-independent.
      </div>
    </Card>
  );
}
