import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
import { LocationPicker } from '@/components/calculator/LocationPicker';

export default function Home() {
  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
      <div className="grid gap-3 min-w-0">
        <BuildPicker />
        <ScheduleEditor />
      </div>
      <div className="grid gap-3 min-w-0 lg:sticky lg:top-3 self-start">
        <LocationPicker />
        <ResultsPanel />
      </div>
    </div>
  );
}
