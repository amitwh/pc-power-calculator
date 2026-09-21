import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { listWorkloads } from '@/lib/data/workloads';
import { Card, CardTitle } from '@/components/ui/Card';
import type { WorkloadSchedule } from '@/types/workload';

const CATEGORY_EMOJI: Record<string, string> = {
  gaming: '🎮',
  content: '🎬',
  productivity: '💼',
  ai: '🤖',
  mining: '⛏️',
  server: '🗄️',
};

export function ScheduleEditor() {
  const buildId = useBuildStore((s) => s.activeBuildId);
  const builds = useBuildStore((s) => s.builds);
  const setSchedule = useBuildStore((s) => s.setSchedule);
  const workloadMap = useMemo(() => new Map(listWorkloads().map((w) => [w.id, w])), []);
  const build = builds.find((b) => b.id === buildId);
  const schedule = build?.schedule ?? [];

  const updateHours = (id: string, hours: number) => {
    const next: WorkloadSchedule[] = schedule.map(
      (s) => (s.workload_id === id ? { ...s, hours_per_day: hours } : s),
    );
    setSchedule(next);
  };

  const totalHours = schedule.reduce((acc: number, s: WorkloadSchedule) => acc + s.hours_per_day, 0);

  return (
    <Card>
      <CardTitle>
        <span>
          <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-brand text-white text-sm font-bold">
            3
          </span>
          Usage schedule
        </span>
        <span className="font-body text-sm font-normal text-gray-500">
          Total: {totalHours.toFixed(1)} h/day
        </span>
      </CardTitle>

      <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
        {schedule.map((s: WorkloadSchedule) => {
          const wl = workloadMap.get(s.workload_id);
          if (!wl) return null;
          const emoji = CATEGORY_EMOJI[wl.category] ?? '⚙️';
          return (
            <div
              key={s.workload_id}
              className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="font-body font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-1.5">
                  <span aria-hidden>{emoji}</span>
                  {wl.name}
                </span>
                <span className="font-numeric tabular-nums text-gray-500 text-sm">
                  {s.hours_per_day} h/day
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                step={0.5}
                value={s.hours_per_day}
                onChange={(e) => updateHours(s.workload_id, Number(e.target.value))}
                aria-label={`Hours per day for ${wl.name}`}
                className="w-full accent-brand h-8"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
