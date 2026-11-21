import { useEffect, useRef } from 'react';
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { AnswerHero } from '@/components/calculator/AnswerHero';
import { MeasuredCard } from '@/components/calculator/MeasuredCard';
import { ResultsBreakdown } from '@/components/calculator/ResultsBreakdown';
import { AllSystemsSummary } from '@/components/calculator/AllSystemsSummary';
import { LocationPicker } from '@/components/calculator/LocationPicker';
import { BuildBar } from '@/components/layout/BuildBar';
import { importBuildFromSearch, importBuildFromPath } from '@/lib/share/buildLink';
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
    const { search, pathname } = window.location;
    // /build/<token> first: a permalink carries a whole configuration.
    if (!importBuildFromPath(pathname)) importBuildFromSearch(search, '/');
    seedPartFromSearch(search);
  }, [hydrated]);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 md:px-8 md:py-6">
      {/* Title and the one-line build switcher share a row: the page's job is
          stated, and everything else is controls or the answer. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* Visible page title. Layout already renders the route's single h1
            (visually hidden), so this stays a styled paragraph to keep exactly
            one h1 in the accessibility tree. */}
        <p className="font-display text-xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
          What does your PC cost to run?
        </p>
        <BuildBar />
      </div>

      {/* 1. The answer, first and biggest. */}
      <AnswerHero />

      {/* 2. Three inputs side by side, in the order you think in them: what it
          is, when you use it, what power costs. */}
      <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.6fr_1.4fr_1fr]">
        <BuildPicker />
        <ScheduleEditor />
        <LocationPicker />
      </div>

      {/* 3. Analysis, consolidated: where the power goes, and what each use costs. */}
      <div className="mt-4">
        <ResultsBreakdown />
      </div>

      <div className="mt-4">
        <MeasuredCard />
      </div>

      <div className="mt-4">
        <AllSystemsSummary />
      </div>
    </div>
  );
}
