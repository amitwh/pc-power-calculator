import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { listComponents } from '@/lib/data/components';
import { listWorkloads } from '@/lib/data/workloads';
import { computeEnergy, resolveRatePerKwh } from '@/lib/calc/energy';
import { suggestAlternatives } from '@/lib/calc/suggest';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';

export default function Suggestions() {
  const { build, currency } = useCalc();
  const setComponent = useBuildStore((s) => s.setComponent);
  const all = useMemo(() => listComponents(), []);

  // Impact estimates use the build's REAL usage (avg hours/day from its
  // schedule, days/week included) and its real tariff — not hardcoded values.
  const { hoursPerDay, ratePerKwh } = useMemo(() => {
    const hours = build.schedule.reduce(
      (acc, s) => acc + (s.hours_per_day * (s.days_per_week ?? 7)) / 7,
      0,
    );
    const yearlyKwh = computeEnergy(build, listWorkloads(), 'year').total.kwh;
    return { hoursPerDay: hours, ratePerKwh: resolveRatePerKwh(build, yearlyKwh, 'year') };
  }, [build]);

  const suggestions = useMemo(
    () => suggestAlternatives(build, all, 'office', hoursPerDay, 365, ratePerKwh),
    [build, all, hoursPerDay, ratePerKwh],
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">Suggestions</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Lower-power alternatives that retain ≥90% of the relevant performance for{' '}
        <strong>{build.name}</strong>, priced at{' '}
        <span className="font-numeric tabular-nums">
          {currency.symbol}
          {ratePerKwh.toFixed(2)}/kWh
        </span>{' '}
        over {hoursPerDay.toFixed(1)} h/day. Suggestions are heuristic — verify
        benchmarks before swapping.
      </p>
      {suggestions.length === 0 ? (
        <div className="text-gray-500 italic">
          No suggestions found for the current build — pick some components on the
          Calculator page first.
        </div>
      ) : (
        suggestions.map((s, i) => (
          <SuggestionCard
            key={`${s.component_id}-${s.alternative.id}-${i}`}
            s={s}
            currency={currency}
            onApply={(altId, slot) => setComponent(slot as never, altId)}
          />
        ))
      )}
    </div>
  );
}
