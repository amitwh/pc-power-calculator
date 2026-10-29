import { lazy, Suspense, useMemo, useState } from 'react';
import { BuildSelector } from '@/components/compare/BuildSelector';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { CompareVerdict } from '@/components/compare/CompareVerdict';
import { Card, CardTitle } from '@/components/ui/Card';
import { useBuildStore } from '@/store/buildStore';
import { currencyForLocation } from '@/lib/data/tariffs';
import { computeEnergy } from '@/lib/calc/energy';
import { listWorkloads } from '@/lib/data/workloads';
import { useFx } from '@/hooks/useFx';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';

// ApexCharts is heavy — only load it once the user actually asks for the
// comparison view and the table has enough rows to chart.
const ComparisonBars = lazy(() =>
  import('@/components/charts/ComparisonBars').then((m) => ({ default: m.ComparisonBars })),
);

/** Session guard: an exported-builds link imports exactly once per load. */
let importHandled = false;

/**
 * Parse `#/compare?builds=<base64 json>` (the link embedded in exported HTML
 * files), add the build to the store, and return its id. Runs once, before
 * first render, so BuildSelector sees the imported build; wipes the query
 * from the URL so a reload can't duplicate the import.
 */
function importBuildFromQuery(): string | null {
  if (importHandled) return null;
  const hash = window.location.hash ?? '';
  const m = hash.match(/[?&]builds=([^&]+)/);
  if (!m) return null;
  importHandled = true;
  try {
    const bin = atob(decodeURIComponent(m[1]));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const parsed = JSON.parse(json) as { build?: unknown };
    if (!parsed?.build) return null;
    const before = new Set(useBuildStore.getState().builds.map((b) => b.id));
    useBuildStore.getState().importBuild(json);
    const added = useBuildStore.getState().builds.find((b) => !before.has(b.id));
    window.history.replaceState(null, '', '#/compare');
    return added?.id ?? null;
  } catch {
    return null;
  }
}

export default function Compare() {
  // Start comparing the first two store builds immediately — no click gate.
  // (If an exported-builds link was just imported, BuildSelector puts it in
  // slot B so the visitor lands on the intended comparison.)
  const [builds, setBuilds] = useState<BuildConfig[] | null>(() =>
    useBuildStore.getState().builds.slice(0, 2),
  );
  const [importedId] = useState(importBuildFromQuery);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const storeBuilds = useBuildStore((s) => s.builds);
  const { snapshot } = useFx();

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

  // True when the compared systems bill in different currencies — the table
  // and verdict convert everything into the display currency.
  const mixedCurrency =
    builds != null &&
    new Set(
      builds.map((b) => currencyForLocation(b.location.country_iso2, b.location.subdivision_code, b.currency_override).code),
    ).size > 1;

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto grid gap-3">
      <BuildSelector onCompare={setBuilds} initialBId={importedId ?? undefined} />
      {builds && builds.length >= 2 && (
        <>
          <CompareVerdict builds={builds} displayCurrency={currency} fxSnapshot={snapshot} />
          <Card>
            <CardTitle>Yearly energy side by side</CardTitle>
            <Suspense fallback={<div className="h-[280px] flex items-center justify-center text-sm text-gray-400">Loading chart...</div>}>
              <ComparisonBars builds={yearlyKwh} />
            </Suspense>
          </Card>
          <Card>
            <CardTitle>
              <span className="truncate">
                Per-workload breakdown ({currency.code})
                {mixedCurrency && (
                  <span className="font-body text-xs font-normal text-gray-500">
                    {' '}· converted at bundled FX ({snapshot.date})
                  </span>
                )}
              </span>
            </CardTitle>
            <ComparisonTable builds={builds} currency={currency} fxSnapshot={snapshot} />
          </Card>
        </>
      )}
    </div>
  );
}
