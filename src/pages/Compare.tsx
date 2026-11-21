import { useEffect, useMemo, useRef, useState } from 'react';
import { BuildSelector } from '@/components/compare/BuildSelector';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { CompareVerdict } from '@/components/compare/CompareVerdict';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { useCalc } from '@/hooks/useCalc';
import { formatCost } from '@/lib/calc/format';
import { useBuildStore } from '@/store/buildStore';
import { buildStats } from '@/lib/calc/buildStats';
import { currencyForLocation } from '@/lib/data/tariffs';
import { useFx } from '@/hooks/useFx';
import { useStoreHydrated } from '@/hooks/useStoreHydration';
import { importBuildFromSearch } from '@/lib/share/buildLink';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';

export default function Compare() {
  const hydrated = useStoreHydrated();

  // Start comparing the first two store builds immediately — no click gate.
  // The store has not been rehydrated yet on the SSR pass or the first client
  // render, so this is the default build; both are corrected below.
  const [builds, setBuilds] = useState<BuildConfig[] | null>(() =>
    useBuildStore.getState().builds.slice(0, 2),
  );
  // `window` is unavailable during the build-time prerender; there is no query
  // string to import there anyway, so the SSR pass starts with null.
  const [importedId, setImportedId] = useState<string | null>(null);
  // Until the visitor picks a pair, the compared builds follow the store.
  const userSelected = useRef(false);
  const importRan = useRef(false);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const storeBuilds = useBuildStore((s) => s.builds);
  const { snapshot } = useFx();
  const addBuild = useBuildStore((s) => s.addBuild);
  const [builderOpen, setBuilderOpen] = useState(false);
  const { build: activeBuild, yearly, currency: activeCurrency } = useCalc();

  // Import an exported-builds link only once localStorage has been applied:
  // importing before rehydration would persist this render's default build
  // over the visitor's saved one.
  useEffect(() => {
    if (!hydrated || importRan.current) return;
    importRan.current = true;
    if (typeof window === 'undefined') return;
    const id = importBuildFromSearch(window.location.search, '/compare');
    if (id) setImportedId(id);
  }, [hydrated]);

  // Mirror the first two store builds into the comparison until the visitor
  // chooses a pair. When a shared link was imported, BuildSelector pins that
  // build to slot B and reports the intended pair, so leave the selection be.
  useEffect(() => {
    if (!hydrated || userSelected.current || importedId) return;
    setBuilds(storeBuilds.slice(0, 2));
  }, [hydrated, importedId, storeBuilds]);

  // The selector is the single source of truth: exactly the pair it reports is
  // compared. Never render a third card that no dropdown names, and never
  // compare a build with itself (that duplicates React keys and leaves stale
  // rows behind on hydration).
  const pair = useMemo(() => {
    if (!builds || builds.length < 2) return null;
    const [first, second] = builds;
    return first.id === second.id ? null : [first, second];
  }, [builds]);

  // Currency follows the active build (or the first selected): explicit
  // override, else the tariff currency of that build's location.
  const currency: CurrencyInfo = useMemo(() => {
    const b =
      storeBuilds.find((x) => x.id === activeBuildId) ?? pair?.[0] ?? storeBuilds[0];
    if (!b) return currencyForLocation('IN');
    return currencyForLocation(b.location.country_iso2, b.location.subdivision_code, b.currency_override);
  }, [activeBuildId, storeBuilds, pair]);

  // Both the verdict and the table read these same numbers — build them once.
  const stats = useMemo(
    () => pair?.map((b) => buildStats(b, currency, snapshot)) ?? null,
    [pair, currency, snapshot],
  );

  return (
    <div className="mx-auto max-w-[1180px] p-3 md:p-6 grid gap-3">
      <BuildSelector
        onCompare={setBuilds}
        initialBId={importedId ?? undefined}
        onUserSelect={() => {
          userSelected.current = true;
        }}
      />
      {/* A compare page should not require a saved pair first: build one here,
          with the same pickers as the calculator, and it joins both slots. */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base!">Build one here</CardTitle>
          <div className="flex items-center gap-2">
            <span className="font-numeric text-sm tabular-nums text-gray-600 dark:text-gray-400">
              {builderOpen && activeBuild.name}: {formatCost(yearly.cost, activeCurrency)} / yr
            </span>
            <Button
              size="sm"
              variant={builderOpen ? 'secondary' : 'primary'}
              onClick={() => {
                if (!builderOpen) addBuild('Compared build');
                setBuilderOpen((o) => !o);
              }}
            >
              {builderOpen ? 'Hide builder' : '+ New build'}
            </Button>
          </div>
        </div>

        {builderOpen && (
          <>
            <p className="mt-1 text-xs text-gray-500">
              Parts and usage for the build you are editing. It is saved in this browser and
              appears in both dropdowns above, so it can be compared against anything.
            </p>
            <div className="mt-2 grid items-start gap-3 lg:grid-cols-[1.5fr_1fr]">
              <BuildPicker />
              <ScheduleEditor />
            </div>
          </>
        )}
      </Card>

      {stats && (
        <>
          <CompareVerdict stats={stats} displayCurrency={currency} />
          <Card>
            <CardTitle className="text-base!">Side by side</CardTitle>
            <ComparisonTable stats={stats} displayCurrency={currency} fxSnapshot={snapshot} />
          </Card>
        </>
      )}
    </div>
  );
}
