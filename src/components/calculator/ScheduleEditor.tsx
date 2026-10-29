import { useMemo, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { listWorkloads } from '@/lib/data/workloads';
import { computeEnergy } from '@/lib/calc/energy';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCost, formatKwh } from '@/lib/calc/format';
import type { WorkloadSchedule, Workload } from '@/types/workload';

const CATEGORY_EMOJI: Record<string, string> = {
  gaming: '🎮',
  content: '🎬',
  productivity: '💼',
  ai: '🤖',
  mining: '⛏️',
  server: '🗄️',
};

const CATEGORY_LABEL: Record<string, string> = {
  gaming: 'Gaming',
  content: 'Content creation',
  productivity: 'Productivity',
  ai: 'AI',
  mining: 'Mining',
  server: 'Server',
};

export function ScheduleEditor() {
  const buildId = useBuildStore((s) => s.activeBuildId);
  const builds = useBuildStore((s) => s.builds);
  const setSchedule = useBuildStore((s) => s.setSchedule);
  const { currency } = useCalc();
  const [addOpen, setAddOpen] = useState(false);
  const workloads = useMemo(() => listWorkloads(), []);
  const workloadMap = useMemo(() => new Map(workloads.map((w) => [w.id, w])), [workloads]);
  const build = builds.find((b) => b.id === buildId);
  const schedule = build?.schedule ?? [];
  const scheduledIds = new Set(schedule.map((s) => s.workload_id));

  // Yearly kWh + cost per scheduled workload (respects tariff + PSU).
  const yearlyByWorkload = useMemo(() => {
    if (!build) return {};
    return Object.fromEntries(
      computeEnergy(build, workloads, 'year').perWorkload.map((r) => [r.workload_id, r]),
    );
  }, [build, workloads]);

  const update = (id: string, patch: Partial<WorkloadSchedule>) => {
    setSchedule(schedule.map((s) => (s.workload_id === id ? { ...s, ...patch } : s)));
  };

  const addWorkload = (id: string) => {
    if (scheduledIds.has(id as Workload['id'])) return;
    setSchedule([...schedule, { workload_id: id as Workload['id'], hours_per_day: 2, days_per_week: 7 }]);
    setAddOpen(false);
  };

  const removeWorkload = (id: string) => {
    setSchedule(schedule.filter((s) => s.workload_id !== id));
  };

  const totalHours = schedule.reduce(
    (acc: number, s: WorkloadSchedule) => acc + (s.hours_per_day * (s.days_per_week ?? 7)) / 7,
    0,
  );
  const unscheduled = workloads.filter((w) => !scheduledIds.has(w.id));
  const byCategory = unscheduled.reduce<Record<string, Workload[]>>((acc, w) => {
    (acc[w.category] ??= []).push(w);
    return acc;
  }, {});

  return (
    <Card>
      <CardTitle className="text-base">
        <span>Usage Schedule</span>
        <span className="font-body text-sm font-normal text-gray-500">
          Total: {totalHours.toFixed(1)} h/day avg
        </span>
      </CardTitle>

      {schedule.length === 0 && (
        <p className="text-sm text-gray-500 mb-2">
          No usage scheduled — add at least one workload to estimate energy use.
        </p>
      )}

      <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
        {schedule.map((s: WorkloadSchedule) => {
          const wl = workloadMap.get(s.workload_id);
          if (!wl) return null;
          const emoji = CATEGORY_EMOJI[wl.category] ?? '⚙️';
          const days = s.days_per_week ?? 7;
          const row = yearlyByWorkload[s.workload_id];
          return (
            <div
              key={s.workload_id}
              className="py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <div className="flex justify-between items-center text-sm mb-1.5 gap-2">
                <span className="font-body font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-1.5 min-w-0">
                  <span aria-hidden>{emoji}</span>
                  <span className="truncate">{wl.name}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {row && row.kwh > 0 && (
                    <span className="font-numeric tabular-nums text-xs text-gray-500">
                      ≈ {formatKwh(row.kwh, 0)}/yr · {formatCost(row.cost, currency)}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${wl.name}`}
                    className="text-base leading-none opacity-60 hover:opacity-100 min-h-[24px] min-w-[24px]"
                    onClick={() => removeWorkload(s.workload_id)}
                  >
                    ×
                  </button>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={0.5}
                  value={s.hours_per_day}
                  onChange={(e) => update(s.workload_id, { hours_per_day: Number(e.target.value) })}
                  aria-label={`Hours per day for ${wl.name}`}
                  className="flex-1 min-w-[140px] accent-brand min-h-[32px]"
                />
                <span className="font-numeric tabular-nums text-gray-500 text-sm w-14 text-right shrink-0">
                  {s.hours_per_day} h/d
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <input
                    type="range"
                    min={1}
                    max={7}
                    step={1}
                    value={days}
                    onChange={(e) => update(s.workload_id, { days_per_week: Number(e.target.value) })}
                    aria-label={`Days per week for ${wl.name}`}
                    className="w-20 accent-brand min-h-[32px]"
                  />
                  <span className="font-numeric tabular-nums text-xs text-gray-500 w-6">
                    {days}d/wk
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add workload */}
      <div className="mt-3">
        {addOpen ? (
          <div className="border border-gray-200 dark:border-gray-800 rounded-8 p-3 space-y-2">
            {Object.entries(byCategory).map(([cat, list]) => (
              <div key={cat}>
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                  {CATEGORY_EMOJI[cat] ?? '⚙️'} {CATEGORY_LABEL[cat] ?? cat}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => addWorkload(w.id)}
                      title={w.description}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-gray-700 px-2.5 py-1 min-h-[32px] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-brand-dark hover:text-brand-dark transition-colors"
                    >
                      + {w.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAddOpen(true)}
            disabled={unscheduled.length === 0}
          >
            + Add workload
          </Button>
        )}
      </div>
    </Card>
  );
}
