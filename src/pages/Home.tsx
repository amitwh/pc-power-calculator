import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
import { LocationPicker } from '@/components/calculator/LocationPicker';

export default function Home() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid gap-4 md:grid-cols-2">
      <BuildPicker />
      <LocationPicker />
      <div className="md:col-span-2"><ScheduleEditor /></div>
      <div className="md:col-span-2"><ResultsPanel /></div>
    </div>
  );
}