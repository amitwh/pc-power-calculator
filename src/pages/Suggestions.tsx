import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { listComponents } from '@/lib/data/components';
import { suggestAlternatives } from '@/lib/calc/suggest';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';

export default function Suggestions() {
  const { build } = useCalc();
  const setComponent = useBuildStore((s) => s.setComponent);
  const rate = build.location.manual_rate_override ?? 7.5;
  const all = useMemo(() => listComponents(), []);
  const suggestions = useMemo(
    () => suggestAlternatives(build, all, 'office', 8, 365, rate),
    [build, all, rate],
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">Suggestions</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Lower-power alternatives that retain ≥90% of the relevant performance for your build.
        Suggestions are heuristic — verify benchmarks before swapping.
      </p>
      {suggestions.length === 0 ? (
        <div className="text-gray-500 italic">No suggestions found for the current build.</div>
      ) : (
        suggestions.map((s, i) => (
          <SuggestionCard key={`${s.component_id}-${s.alternative.id}-${i}`} s={s} onApply={(altId, slot) => setComponent(slot as never, altId)} />
        ))
      )}
    </div>
  );
}