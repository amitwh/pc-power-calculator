import { dataLastUpdated as componentsLastUpdated, listComponents, catalogSize } from '@/lib/data/components';
import { tariffsLastUpdated } from '@/lib/data/tariffs';
import { benchmarkLastUpdated } from '@/lib/data/benchmarks';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import { Card, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import type { ReactNode } from 'react';
import type { ComponentCategory } from '@/types/component';

const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  cpu: 'CPUs',
  gpu: 'Graphics cards',
  motherboard: 'Motherboards',
  ram: 'RAM kits',
  storage: 'Storage',
  psu: 'PSUs',
  cooler: 'Coolers',
  fan: 'Case fans',
  monitor: 'Monitors',
  add_in_card: 'Add-in cards',
  optical_drive: 'Optical drives',
  ups: 'UPS units',
  peripheral: 'Peripherals',
};

/** One label/value pair, repeated consistently in every dataset card. */
function Datum({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-numeric tabular-nums">{children}</dd>
    </>
  );
}

export default function DataFreshness() {
  const counts = (Object.keys(CATEGORY_LABELS) as ComponentCategory[])
    .map((cat) => ({ cat, n: listComponents(cat).length }))
    .filter(({ n }) => n > 0);

  const fx = getBundledFxSnapshot();

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader title="Data freshness" />
      <div className="grid gap-3">
        <Card>
          <CardTitle>components.json</CardTitle>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <Datum label="Last updated">{componentsLastUpdated()}</Datum>
            <Datum label="Catalog">{catalogSize()} parts (2000–2026)</Datum>
          </dl>
          <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm font-numeric tabular-nums text-gray-600 dark:text-gray-400">
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
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <Datum label="Last updated">{tariffsLastUpdated()}</Datum>
          </dl>
        </Card>
        <Card>
          <CardTitle>benchmarks.json</CardTitle>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <Datum label="Last updated">{benchmarkLastUpdated()}</Datum>
          </dl>
        </Card>
        <Card>
          <CardTitle>fx_rates.json</CardTitle>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <Datum label="Snapshot">{fx.date}</Datum>
            <Datum label="Source">{fx.source}</Datum>
          </dl>
        </Card>
      </div>
    </div>
  );
}
