import { BuildPicker } from '@/components/calculator/BuildPicker';

export default function Home() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid gap-4 md:grid-cols-2">
      <BuildPicker />
    </div>
  );
}
