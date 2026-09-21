import { useMemo, useState } from 'react';
import { BuildSelector } from '@/components/compare/BuildSelector';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { ComparisonBars } from '@/components/charts/ComparisonBars';
import { Card, CardTitle } from '@/components/ui/Card';
import { useBuildStore } from '@/store/buildStore';
import { findCurrency } from '@/lib/data/currencies';
import { computeEnergy } from '@/lib/calc/energy';
import { listWorkloads } from '@/lib/data/workloads';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';

const DEFAULT_INR: CurrencyInfo = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
  decimalDigits: 0,
};

export default function Compare() {
  const [builds, setBuilds] = useState<BuildConfig[] | null>(null);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const storeBuilds = useBuildStore((s) => s.builds);

  // Currency follows the active build (or the first selected) — falls back to INR.
  const currency: CurrencyInfo = useMemo(() => {
    const fromActive = storeBuilds.find((b) => b.id === activeBuildId)?.currency_override;
    const fromFirst = builds?.[0]?.currency_override;
    return (
      findCurrency(fromActive ?? '') ??
      findCurrency(fromFirst ?? '') ??
      DEFAULT_INR
    );
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
            <ComparisonBars builds={yearlyKwh} />
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
