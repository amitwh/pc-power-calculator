import { Fragment } from 'react';
import { formatCost, formatKwh } from '@/lib/calc/format';
import type { BuildStats } from '@/lib/calc/buildStats';
import type { CurrencyInfo, FxSnapshot } from '@/types/currency';

interface Props {
  /** Exactly the two systems the selector shows as A and B. */
  stats: BuildStats[];
  /** Display currency for all money figures. */
  displayCurrency: CurrencyInfo;
  fxSnapshot: FxSnapshot;
}

interface Row {
  label: string;
  a: string;
  b: string;
  /** Signed delta between B and A. */
  diff: string;
}

/** "+95 kWh" / "−95 kWh", or "0" when the rounded gap is nothing. */
function signed(delta: number, format: (n: number) => string): string {
  if (Math.round(delta) === 0) return '0';
  return `${delta > 0 ? '+' : '−'}${format(Math.abs(delta))}`;
}

function psuShortfall(s: BuildStats): string | null {
  if (s.installedPsuW == null || s.installedPsuW >= s.recommendedPsuW) return null;
  return `Installed ${s.installedPsuW} W PSU is below the ${s.recommendedPsuW} W recommendation.`;
}

/**
 * The whole comparison on five rows: System A, System B and the B − A delta.
 * Below `md` the same rows become a definition list per system so nothing has
 * to scroll sideways on a phone.
 */
export function ComparisonTable({ stats, displayCurrency, fxSnapshot }: Props) {
  const [a, b] = stats;
  if (!a || !b) return null;

  const rows: Row[] = [
    {
      label: 'Energy / year',
      a: formatKwh(a.kwhYear, 0),
      b: formatKwh(b.kwhYear, 0),
      diff: signed(b.kwhYear - a.kwhYear, (n) => formatKwh(n, 0)),
    },
    {
      label: 'Cost / year',
      a: formatCost(a.costYear, displayCurrency),
      b: formatCost(b.costYear, displayCurrency),
      diff: signed(b.costYear - a.costYear, (n) => formatCost(n, displayCurrency)),
    },
    {
      label: 'Peak draw',
      a: `${Math.round(a.peakWallDrawW)} W`,
      b: `${Math.round(b.peakWallDrawW)} W`,
      diff: signed(b.peakWallDrawW - a.peakWallDrawW, (n) => `${Math.round(n)} W`),
    },
    {
      label: 'PSU needed',
      a: `${a.recommendedPsuW} W`,
      b: `${b.recommendedPsuW} W`,
      diff: signed(b.recommendedPsuW - a.recommendedPsuW, (n) => `${Math.round(n)} W`),
    },
    {
      label: 'Devices',
      a: `${a.deviceCount}`,
      b: `${b.deviceCount}`,
      diff: signed(b.deviceCount - a.deviceCount, (n) => `${n}`),
    },
  ];

  const psuNotes = stats
    .map((s) => {
      const shortfall = psuShortfall(s);
      return shortfall ? `${s.name}: ${shortfall}` : null;
    })
    .filter((note): note is string => note != null);

  const anyConverted = stats.some((s) => s.converted);

  return (
    <div>
      <table className="hidden md:table w-full font-numeric tabular-nums">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th scope="col" className="text-left p-2 font-display text-sm">
              <span className="sr-only">Metric</span>
            </th>
            <th scope="col" data-testid="compare-system" className="text-right p-2 font-display text-sm">
              <span className="block">System A</span>
              <span className="block font-body text-xs font-normal text-gray-500 break-words">{a.name}</span>
            </th>
            <th scope="col" data-testid="compare-system" className="text-right p-2 font-display text-sm">
              <span className="block">System B</span>
              <span className="block font-body text-xs font-normal text-gray-500 break-words">{b.name}</span>
            </th>
            <th scope="col" className="text-right p-2 font-display text-sm">
              <span className="block">Difference</span>
              <span className="block font-body text-xs font-normal text-gray-500">B − A</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.label}>
              <tr className="border-b border-gray-100 dark:border-gray-900">
                <th
                  scope="row"
                  className="text-left p-2 font-body text-sm font-normal text-gray-600 dark:text-gray-400"
                >
                  {r.label}
                </th>
                <td className="p-2 text-right text-sm text-gray-900 dark:text-gray-50">{r.a}</td>
                <td className="p-2 text-right text-sm text-gray-900 dark:text-gray-50">{r.b}</td>
                <td className="p-2 text-right text-sm text-gray-600 dark:text-gray-400">{r.diff}</td>
              </tr>
              {r.label === 'PSU needed' && psuNotes.length > 0 && (
                <tr>
                  <td colSpan={4} className="px-2 pb-2 pt-0 text-xs text-gray-500">
                    {psuNotes.join(' ')}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      <div className="md:hidden grid gap-3">
        {stats.map((s, i) => {
          const note = psuShortfall(s);
          return (
            <div key={`${s.id}-${i}`} data-testid="compare-system-row">
              <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1 break-words">
                {i === 0 ? 'System A' : 'System B'} — {s.name}
              </h3>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-numeric tabular-nums">
                {rows.map((r) => (
                  <Fragment key={r.label}>
                    <dt className="text-gray-500">{r.label}</dt>
                    <dd className="text-right text-gray-900 dark:text-gray-50">
                      {i === 0 ? r.a : r.b}
                    </dd>
                  </Fragment>
                ))}
              </dl>
              {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
            </div>
          );
        })}
        <div>
          <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
            Difference (B − A)
          </h3>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-numeric tabular-nums">
            {rows.map((r) => (
              <Fragment key={r.label}>
                <dt className="text-gray-500">{r.label}</dt>
                <dd className="text-right text-gray-900 dark:text-gray-50">{r.diff}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </div>

      {anyConverted && (
        <p className="mt-2 text-xs text-gray-500">
          Costs converted to {displayCurrency.code} at bundled FX rates ({fxSnapshot.date}).
        </p>
      )}
    </div>
  );
}
