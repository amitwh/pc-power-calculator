import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';

export default function Home() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <BuildPicker />
      </div>
      <div className="md:col-span-2">
        <ScheduleEditor />
      </div>
      <div className="md:col-span-2">
        <ResultsPanel />
      </div>
    </div>
  );
}
