import { useEffect, useRef } from 'react';
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
import { ResultsBreakdown } from '@/components/calculator/ResultsBreakdown';
import { AllSystemsSummary } from '@/components/calculator/AllSystemsSummary';
import { LocationPicker } from '@/components/calculator/LocationPicker';
import { SectionRail } from '@/components/layout/SectionRail';
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
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      {/* Visible page title. Layout already renders the route's single h1
          (visually hidden), so this stays a styled paragraph to keep exactly
          one h1 in the accessibility tree. */}
      <p className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">
        What does your PC cost to run?
      </p>

      {/* Workbench: [rail 176px] [work area] [results 320px] at ≥1100px. Below
          that it is one column with the results first (order-first), so the
          yearly figure is the first thing on a phone. */}
      <div className="grid grid-cols-1 gap-3 min-[1100px]:grid-cols-[176px_minmax(0,1fr)_320px]">
        <SectionRail />

        <div className="grid grid-cols-1 gap-3 min-w-0">
          <section id="system" className="scroll-mt-6">
            <BuildPicker />
          </section>
          <section id="usage" className="scroll-mt-6">
            <ScheduleEditor />
          </section>
          <section id="tariff" className="scroll-mt-6">
            <LocationPicker />
          </section>
          <section id="analysis" className="scroll-mt-6">
            <ResultsBreakdown />
          </section>
        </div>

        {/* Plain grid item stretches to the row height; only the INNER wrapper
            is sticky, so it stays inside this column and can never float over
            the sections. */}
        <aside className="min-w-0 order-first min-[1100px]:order-none" aria-label="Results">
          <div className="grid grid-cols-1 gap-3 min-[1100px]:sticky min-[1100px]:top-5">
            <ResultsPanel />
            <AllSystemsSummary />
          </div>
        </aside>
      </div>
    </div>
  );
}
