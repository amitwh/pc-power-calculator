import { dataLastUpdated as componentsLastUpdated } from '@/lib/data/components';
import { tariffsLastUpdated } from '@/lib/data/tariffs';
import { benchmarkLastUpdated } from '@/lib/data/benchmarks';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import { Card, CardTitle } from '@/components/ui/Card';

export default function DataFreshness() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">Data freshness</h1>
      <Card>
        <CardTitle>components.json</CardTitle>
        <p className="font-numeric tabular-nums">Last updated: {componentsLastUpdated()}</p>
      </Card>
      <Card>
        <CardTitle>tariffs.json</CardTitle>
        <p className="font-numeric tabular-nums">Last updated: {tariffsLastUpdated()}</p>
      </Card>
      <Card>
        <CardTitle>benchmarks.json</CardTitle>
        <p className="font-numeric tabular-nums">Last updated: {benchmarkLastUpdated()}</p>
      </Card>
      <Card>
        <CardTitle>fx_rates.json</CardTitle>
        <p className="font-numeric tabular-nums">Snapshot: {getBundledFxSnapshot().date} · source: {getBundledFxSnapshot().source}</p>
      </Card>
    </div>
  );
}