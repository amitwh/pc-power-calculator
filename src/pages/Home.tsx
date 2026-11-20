import { useEffect } from 'react';
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
import { ResultsBreakdown } from '@/components/calculator/ResultsBreakdown';
import { AllSystemsSummary } from '@/components/calculator/AllSystemsSummary';
import { LocationPicker } from '@/components/calculator/LocationPicker';
import { importBuildFromSearch } from '@/lib/share/buildLink';
import { findComponent } from '@/lib/data/components';
import { useBuildStore } from '@/store/buildStore';
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
  // A shared `?builds=` link works on the calculator too: import it once on
  // mount. importBuild makes the imported build active; a bad token is a
  // silent no-op, leaving the default build in place.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    importBuildFromSearch(search, '/');
    seedPartFromSearch(search);
  }, []);

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid grid-cols-1 gap-3 min-w-0">
        <BuildPicker />
        <ScheduleEditor />
      </div>
      {/* Plain grid item stretches to the row height; only the INNER wrapper
          is sticky, so it stays inside this row and can never float over the
          full-width sections below. */}
      <div className="min-w-0">
        <div className="grid grid-cols-1 gap-3 lg:sticky lg:top-3">
          <LocationPicker />
          <ResultsPanel />
        </div>
      </div>
      <div className="min-w-0 lg:col-span-2">
        <ResultsBreakdown />
      </div>
      <div className="min-w-0 lg:col-span-2">
        <AllSystemsSummary />
      </div>
    </div>
  );
}
