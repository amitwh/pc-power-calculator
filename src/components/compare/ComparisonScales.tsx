import { Card, CardTitle } from '@/components/ui/Card';
import { formatCost, formatKwh } from '@/lib/calc/format';
import type { BuildStats } from '@/lib/calc/buildStats';
import type { CurrencyInfo } from '@/types/currency';

interface Props {
  /** Exactly the two systems the selector shows as A and B. */
  stats: BuildStats[];
  /** Display currency for money figures. */
  displayCurrency: CurrencyInfo;
}

interface Metric {
  key: string;
  label: string;
  unit: string;
  a: number;
  b: number;
  format: (n: number) => string;
  /** Why this metric matters, one line. */
  note: string;
}

const A_COLOR = 'var(--color-brand)';
const B_COLOR = 'var(--color-info)';

/**
 * Paired bars, one pair per metric, each pair scaled to its own maximum.
 *
 * Two numbers in a table tell you which is bigger; bars on a shared scale tell
 * you by how much, and the per-row scale keeps the peak-draw row from being
 * flattened by the kWh row's magnitude.
 */
export function ComparisonScales({ stats, displayCurrency }: Props) {
  const [a, b] = stats;
  if (!a || !b) return null;

  const metrics: Metric[] = [
    {
      key: 'energy',
      label: 'Energy per year',
      unit: 'kWh',
      a: a.kwhYear,
      b: b.kwhYear,
      format: (n) => formatKwh(n, 0),
      note: 'The raw electricity, before any tariff.',
    },
    {
      key: 'cost',
      label: 'Cost per year',
      unit: displayCurrency.code,
      a: a.costYear,
      b: b.costYear,
      format: (n) => formatCost(n, displayCurrency),
      note: 'What that energy costs at each system’s own tariff.',
    },
    {
      key: 'peak',
      label: 'Peak draw at the wall',
      unit: 'W',
      a: a.peakWallDrawW,
      b: b.peakWallDrawW,
      format: (n) => `${Math.round(n)} W`,
      note: 'Every component at 100%, after PSU conversion.',
    },
    {
      key: 'psu',
      label: 'PSU size needed',
      unit: 'W',
      a: a.recommendedPsuW,
      b: b.recommendedPsuW,
      format: (n) => `${Math.round(n)} W`,
      note: 'Peak component draw plus 35% headroom.',
    },
  ];

  return (
    <Card>
      <CardTitle className="text-base">Side by side, to scale</CardTitle>
      <p className="mb-3 -mt-1 text-xs text-gray-500">
        Each row is scaled to its own larger value, so the pair is comparable but rows are not.
      </p>

      <div className="grid gap-4">
        {metrics.map((m) => {
          const max = Math.max(m.a, m.b, 1);
          const pa = (m.a / max) * 100;
          const pb = (m.b / max) * 100;
          const gap = m.a > 0 ? ((m.b - m.a) / m.a) * 100 : 0;
          const same = Math.round(m.a) === Math.round(m.b);
          return (
            <div key={m.key}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {m.label}
                </span>
                <span className="font-numeric text-[11px] tabular-nums text-gray-500">
                  {same ? 'identical' : `${gap > 0 ? '+' : '−'}${Math.abs(Math.round(gap))}% on B`}
                </span>
              </div>

              {/* A pair of bars on one track, with quarter gridlines. */}
              <div className="relative">
                <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-between">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="h-full w-px bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>

                {([
                  { name: 'A', label: a.name, value: m.a, pct: pa, color: A_COLOR },
                  { name: 'B', label: b.name, value: m.b, pct: pb, color: B_COLOR },
                ] as const).map((row) => (
                  <div key={row.name} className="relative flex items-center gap-2 py-0.5">
                    <span
                      aria-hidden
                      className="w-3 shrink-0 font-numeric text-[10px] font-bold tabular-nums text-gray-400"
                    >
                      {row.name}
                    </span>
                    <span aria-hidden className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${Math.max(1, row.pct)}%`, background: row.color }}
                      />
                    </span>
                    <span className="w-24 shrink-0 text-right font-numeric text-xs font-semibold tabular-nums">
                      {m.format(row.value)}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-0.5 text-[11px] leading-tight text-gray-400">{m.note}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 pt-2 text-[11px] text-gray-500 dark:border-gray-800">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: A_COLOR }} aria-hidden />
          A · {a.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: B_COLOR }} aria-hidden />
          B · {b.name}
        </span>
      </div>
    </Card>
  );
}
