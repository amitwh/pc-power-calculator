import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Suggestion } from '@/lib/calc/suggest';
import { formatCost, formatKwh } from '@/lib/calc/format';

const INR = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 0 } as const;

export function SuggestionCard({ s, onApply }: { s: Suggestion; onApply: (altId: string, slot: string) => void }) {
  return (
    <Card className="border-l-4 border-l-brand">
      <div className="font-display text-sm uppercase text-gray-500">{s.category}</div>
      <div className="flex justify-between items-baseline mt-1">
        <div>
          <div className="text-sm line-through text-gray-500">{s.current.tdp_w} W → </div>
          <div className="font-display text-lg font-bold">{s.alternative.brand} {s.alternative.model}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{s.alt.tdp_w} W · {s.impact.perf_retention_pct.toFixed(0)}% perf retained</div>
        </div>
        <div className="text-right font-numeric tabular-nums">
          <div className="text-success font-bold">-{formatKwh(s.impact.kwh_saved_per_year, 0)}/yr</div>
          <div className="text-success font-bold">{formatCost(s.impact.cost_saved_per_year, INR)}/yr</div>
        </div>
      </div>
      <Button variant="secondary" className="mt-2" onClick={() => onApply(s.alternative.id, s.category)}>Apply</Button>
    </Card>
  );
}