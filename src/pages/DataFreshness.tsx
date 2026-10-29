import { dataLastUpdated as componentsLastUpdated, listComponents, catalogSize } from '@/lib/data/components';
import { tariffsLastUpdated } from '@/lib/data/tariffs';
import { benchmarkLastUpdated } from '@/lib/data/benchmarks';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import { Card, CardTitle } from '@/components/ui/Card';
import type { ComponentCategory } from '@/types/component';

const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  cpu: 'CPUs',
  gpu: 'Graphics cards',
  motherboard: 'Motherboards',
  ram: 'RAM kits',
  storage: 'Storage',
  psu: 'PSUs',
  cooler: 'Coolers',
  monitor: 'Monitors',
  add_in_card: 'Add-in cards',
  optical_drive: 'Optical drives',
  ups: 'UPS units',
  peripheral: 'Peripherals',
};

export default function DataFreshness() {
  const counts = (Object.keys(CATEGORY_LABELS) as ComponentCategory[])
    .map((cat) => ({ cat, n: listComponents(cat).length }))
    .filter(({ n }) => n > 0);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">Data freshness</h1>
      <Card>
        <CardTitle>components.json</CardTitle>
        <p className="font-numeric tabular-nums">
          Last updated: {componentsLastUpdated()} · {catalogSize()} parts (2000–2026)
        </p>
        <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm font-numeric tabular-nums text-gray-600 dark:text-gray-400">
          {counts.map(({ cat, n }) => (
            <li key={cat} className="flex justify-between">
              <span>{CATEGORY_LABELS[cat]}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{n}</span>
            </li>
          ))}
        </ul>
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
