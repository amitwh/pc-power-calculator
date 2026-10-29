import { lazy, Suspense, useMemo, useState } from 'react';
import { BuildSelector } from '@/components/compare/BuildSelector';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { useBuildStore } from '@/store/buildStore';
import { currencyForLocation } from '@/lib/data/tariffs';
import { computeEnergy } from '@/lib/calc/energy';
import { listWorkloads } from '@/lib/data/workloads';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';

// ApexCharts is heavy — only load it once the user actually asks for the
// comparison view and the table has enough rows to chart.
const ComparisonBars = lazy(() =>
  import('@/components/charts/ComparisonBars').then((m) => ({ default: m.ComparisonBars })),
);

export default function Compare() {
  const [builds, setBuilds] = useState<BuildConfig[] | null>(null);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const storeBuilds = useBuildStore((s) => s.builds);

  // Currency follows the active build (or the first selected): explicit
  // override, else the tariff currency of that build's location.
  const currency: CurrencyInfo = useMemo(() => {
    const b =
      storeBuilds.find((x) => x.id === activeBuildId) ?? builds?.[0] ?? storeBuilds[0];
    if (!b) return currencyForLocation('IN');
    return currencyForLocation(b.location.country_iso2, b.location.subdivision_code, b.currency_override);
  }, [activeBuildId, storeBuilds, builds]);

  // Yearly kWh per build for the bar chart.
  const yearlyKwh = useMemo(() => {
    if (!builds) return [];
    const workloads = listWorkloads();
    return builds.map((b) => ({
      id: b.id,
      name: b.name,
      yearlyKwh: computeEnergy(b, workloads, 'year', b.location.manual_rate_override ?? undefined)
        .total.kwh,
    }));
  }, [builds]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid gap-4">
      <BuildSelector onCompare={setBuilds} />
      {builds && builds.length >= 2 && (
        <>
          <Card>
            <CardTitle>Yearly energy side by side</CardTitle>
            <Suspense fallback={<div className="h-[280px] flex items-center justify-center text-sm text-gray-400">Loading chart...</div>}>
              <ComparisonBars builds={yearlyKwh} />
            </Suspense>
          </Card>
          <Card>
            <CardTitle>Per-workload breakdown ({currency.code})</CardTitle>
            <ComparisonTable builds={builds} currency={currency} />
          </Card>
        </>
      )}
    </div>
  );
}
