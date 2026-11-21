import { Card } from '@/components/ui/Card';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { emojiFor } from '@/lib/buildCategory';
import type { BuildStats } from '@/lib/calc/buildStats';
import type { CurrencyInfo } from '@/types/currency';

interface Props {
  /** Exactly the two systems the selector shows as A and B. */
  stats: BuildStats[];
  /** Display currency for all money figures. */
  displayCurrency: CurrencyInfo;
}

/**
 * The one-line answer plus a two-bar energy comparison. Everything the visitor
 * needs to know at a glance — no stat tiles, no chart bundle.
 */
export function CompareVerdict({ stats, displayCurrency }: Props) {
  const [a, b] = stats;
  if (!a || !b) return null;

  // Cheapest to RUN = lowest yearly cost; kWh decides when costs are equal.
  const cheaper = b.costYear !== a.costYear ? (b.costYear < a.costYear ? b : a) : (b.kwhYear < a.kwhYear ? b : a);
  const pricier = cheaper.id === a.id ? b : a;
  const kwhSaved = pricier.kwhYear - cheaper.kwhYear;
  const costSaved = pricier.costYear - cheaper.costYear;
  const pct = pricier.kwhYear > 0 ? Math.round((Math.abs(kwhSaved) / pricier.kwhYear) * 100) : 0;
  const converted = a.converted || b.converted;

  // A gap smaller than one displayed unit is a rounding hair, not a saving.
  const aboutSame = Math.abs(costSaved) < 1 || Math.round(a.costYear) === Math.round(b.costYear);

  const energyPhrase =
    kwhSaved > 0 ? `${pct}% less energy` : kwhSaved < 0 ? `${pct}% more energy` : 'same energy';
  const monthlyPhrase = `${formatCost(Math.abs(costSaved) / 12, displayCurrency)}/month cheaper`;
  const subline = [energyPhrase, monthlyPhrase, converted ? 'costs at bundled FX' : '']
    .filter(Boolean)
    .join(' · ');

  const maxKwh = Math.max(a.kwhYear, b.kwhYear, 1);

  return (
    <Card>
      {aboutSame ? (
        <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
          These two cost about the same to run
        </p>
      ) : (
        <>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {cheaper.name} costs{' '}
            <span className="font-numeric tabular-nums">{formatCost(costSaved, displayCurrency)}</span> less per year
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-numeric tabular-nums">{subline}</p>
        </>
      )}

      <div className="mt-4 grid gap-3">
        {stats.map((s, i) => {
          const isCheaper = !aboutSame && s.id === cheaper.id;
          return (
            <div key={`${s.id}-${i}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm">
                <span className="flex flex-wrap items-center gap-1.5 font-medium text-gray-900 dark:text-gray-50">
                  <span aria-hidden>{emojiFor(s.category)}</span>
                  <span className="break-words">{s.name}</span>
                  {isCheaper && (
                    <span className="text-[11px] font-semibold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 whitespace-nowrap">
                      cheaper to run
                    </span>
                  )}
                </span>
                <span className="font-numeric tabular-nums font-semibold text-gray-700 dark:text-gray-300">
                  {formatKwh(s.kwhYear, 0)}
                </span>
              </div>
              <div
                aria-hidden
                className="mt-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden"
              >
                <div
                  // The longer bar belonged to the non-cheaper build and was
                  // grey-on-grey, so the biggest energy use looked empty.
                  className={`h-full rounded-full ${
                    isCheaper ? 'bg-brand' : 'bg-gray-400 dark:bg-gray-500'
                  }`}
                  style={{ width: `${(s.kwhYear / maxKwh) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
