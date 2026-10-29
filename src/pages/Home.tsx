import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
import { ResultsBreakdown } from '@/components/calculator/ResultsBreakdown';
import { AllSystemsSummary } from '@/components/calculator/AllSystemsSummary';
import { LocationPicker } from '@/components/calculator/LocationPicker';

export default function Home() {
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
