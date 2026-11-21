import { useEffect, useRef } from 'react';
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
import { ResultsBreakdown } from '@/components/calculator/ResultsBreakdown';
import { AllSystemsSummary } from '@/components/calculator/AllSystemsSummary';
import { LocationPicker } from '@/components/calculator/LocationPicker';
import { BuildBar } from '@/components/layout/BuildBar';
import { importBuildFromSearch } from '@/lib/share/buildLink';
import { findComponent } from '@/lib/data/components';
import { useBuildStore } from '@/store/buildStore';
import { useStoreHydrated } from '@/hooks/useStoreHydration';
import type { ComponentSlot } from '@/types/build';

/** Part category → the calculator slot it belongs in. */
const PART_SLOT: Record<string, ComponentSlot> = {
  cpu: 'cpu',
  gpu: 'gpu',
  motherboard: 'motherboard',
  psu: 'psu',
  cooler: 'cooler',
  ram: 'ram',
  storage: 'storage',
  monitor: 'monitor',
  add_in_card: 'add_in_card',
  optical_drive: 'optical_drive',
  ups: 'ups',
  fan: 'fans',
  peripheral: 'peripheral',
};

/**
 * A `/parts/:id` page links here with `?part=<id>`; select that part in the
 * matching slot, then strip the query. Unknown ids are ignored.
 */
function seedPartFromSearch(search: string): void {
  const match = search.match(/[?&]part=([^&]+)/);
  if (!match) return;

  let id: string;
  try {
    id = decodeURIComponent(match[1]);
  } catch {
    return;
  }
  const part = findComponent(id);
  if (!part) return;

  const slot = PART_SLOT[part.category] ?? 'peripheral';
  useBuildStore.getState().addComponent(slot, part.id);
  window.history.replaceState(null, '', window.location.pathname);
}

export default function Home() {
  const hydrated = useStoreHydrated();
  const seeded = useRef(false);

  // A shared `?builds=` link works on the calculator too: import it once,
  // after localStorage has been applied. Writing to the store before
  // rehydration would persist the default build over the visitor's saved one.
  // The ref keeps StrictMode's double-invoked effect from seeding twice.
  useEffect(() => {
    if (!hydrated || seeded.current) return;
    if (typeof window === 'undefined') return;
    seeded.current = true;
    const search = window.location.search;
    importBuildFromSearch(search, '/');
    seedPartFromSearch(search);
  }, [hydrated]);

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-2.5 md:px-5 md:py-3">
      {/* Title and the one-line build switcher share a row: the page's job is
          stated, and everything else is controls or the answer. */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* Visible page title. Layout already renders the route's single h1
            (visually hidden), so this stays a styled paragraph to keep exactly
            one h1 in the accessibility tree. */}
        <p className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-50">
          What does your PC cost to run?
        </p>
        <BuildBar />
      </div>

      {/* Everything above the fold on a laptop: inputs on the left, the answer
          pinned on the right. On a phone the answer comes first (order-first)
          so the yearly figure is never below the fold. The chart and
          per-workload tables are the only things that deliberately sit below. */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* `grid-cols-1` is load-bearing: without it the implicit column sizes
            to its content's min-content width, which pushed the cards past the
            phone viewport. */}
        <div className="grid min-w-0 grid-cols-1 gap-2.5">
          <BuildPicker />
          <ScheduleEditor />
          <LocationPicker />
        </div>

        {/* The aside stretches to the grid row; only the INNER wrapper sticks,
            so the answer stays in view while the inputs scroll past it. */}
        <aside className="order-first min-w-0 lg:order-none" aria-label="Results">
          <div className="lg:sticky lg:top-3">
            <ResultsPanel />
          </div>
        </aside>
      </div>

      <div className="mt-2.5">
        <ResultsBreakdown />
      </div>

      <div className="mt-2.5">
        <AllSystemsSummary />
      </div>
    </div>
  );
}
