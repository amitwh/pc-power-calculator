import { useMemo, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { listWorkloads } from '@/lib/data/workloads';
import { computeEnergy } from '@/lib/calc/energy';
import { Card } from '@/components/ui/Card';
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

interface StepperProps {
  /** Accessible name stem, e.g. "Office hours". */
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}

/** A compact − value + control; step is always 1 hour/day. */
function Stepper({ label, value, min, max, unit, onChange }: StepperProps) {
  const buttonClass =
    'min-h-9 min-w-9 rounded-8 border border-gray-300 dark:border-gray-700 text-base leading-none opacity-80 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed';
  return (
    <span className="inline-flex items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={buttonClass}
      >
        −
      </button>
      <span
        aria-live="polite"
        className="font-numeric tabular-nums text-sm w-12 text-center"
      >
        {value} {unit}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={buttonClass}
      >
        +
      </button>
    </span>
  );
}

export function ScheduleEditor() {
  const buildId = useBuildStore((s) => s.activeBuildId);
  const builds = useBuildStore((s) => s.builds);
  const setSchedule = useBuildStore((s) => s.setSchedule);
  const setIdleHoursPerDay = useBuildStore((s) => s.setIdleHoursPerDay);
  const { currency } = useCalc();
  const [addOpen, setAddOpen] = useState(false);
  const workloads = useMemo(() => listWorkloads(), []);
  const workloadMap = useMemo(() => new Map(workloads.map((w) => [w.id, w])), [workloads]);
  const build = builds.find((b) => b.id === buildId);
  const schedule = build?.schedule ?? [];
  const idleHours = build?.idle_hours_per_day ?? 0;
  const scheduledIds = new Set(schedule.map((s) => s.workload_id));

  const totalHours = schedule.reduce(
    (acc: number, s: WorkloadSchedule) => acc + (s.hours_per_day * (s.days_per_week ?? 7)) / 7,
    0,
  );
  // The 24-hour budget is per calendar DAY: workload hours are additive
  // energy blocks, so the sum of hours_per_day cannot exceed 24 no matter
  // how many days a week each runs. Idle hours share the same budget.
  // `remaining` caps every stepper.
  const dailyHours =
    schedule.reduce((acc: number, s: WorkloadSchedule) => acc + s.hours_per_day, idleHours);
  const avgHours = totalHours;
  const overBudget = dailyHours > 24 + 1e-9;
  const remaining = Math.max(0, 24 - dailyHours);
  const anyPartWeek = schedule.some((s) => (s.days_per_week ?? 7) < 7);

  // Yearly kWh + cost per scheduled workload (respects tariff + PSU).
  const yearlyByWorkload = useMemo(() => {
    if (!build) return {};
    return Object.fromEntries(
      computeEnergy(build, workloads, 'year').perWorkload.map((r) => [r.workload_id, r]),
    );
  }, [build, workloads]);

  const idleRow = yearlyByWorkload['idle'];

  const update = (id: string, patch: Partial<WorkloadSchedule>) => {
    setSchedule(schedule.map((s) => (s.workload_id === id ? { ...s, ...patch } : s)));
  };

  const addWorkload = (id: string) => {
    if (scheduledIds.has(id as Workload['id'])) return;
    // A new workload can only claim hours the day still has free.
    const hours = Math.min(2, Math.max(remaining, 0));
    setSchedule([
      ...schedule,
      { workload_id: id as Workload['id'], hours_per_day: hours > 0 ? hours : 0, days_per_week: 7 },
    ]);
    setAddOpen(false);
  };

  const removeWorkload = (id: string) => {
    setSchedule(schedule.filter((s) => s.workload_id !== id));
  };

  const unscheduled = workloads.filter((w) => !scheduledIds.has(w.id));
  const byCategory = unscheduled.reduce<Record<string, Workload[]>>((acc, w) => {
    (acc[w.category] ??= []).push(w);
    return acc;
  }, {});

  return (
    <Card>
      <div className="mb-2 flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <h2 className="font-display text-base font-bold">Usage Schedule</h2>
        <span
          className={`font-body text-xs font-normal font-numeric tabular-nums sm:text-right ${
            overBudget ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500'
          }`}
        >
          <span className="hidden sm:inline">
            {dailyHours.toFixed(1)} of 24 h/day booked · {remaining.toFixed(1)} h free
            {anyPartWeek && !overBudget ? ` · ${avgHours.toFixed(1)} h/day avg` : ''}
          </span>
          <span className="sm:hidden">{dailyHours.toFixed(1)} h of 24 booked</span>
        </span>
      </div>

      {overBudget && (
        <p
          role="alert"
          className="mb-2 rounded-8 border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          This schedule totals {dailyHours.toFixed(1)} h in a day — a day only has 24. Lower some
          workloads below; until then the estimate above is overstated.
        </p>
      )}

      {schedule.length === 0 && (
        <p className="text-sm text-gray-500 mb-2">
          No usage scheduled — add at least one workload to estimate energy use.
        </p>
      )}

      <div>
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="order-1 font-body font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-1.5 min-w-0 flex-1 basis-40">
                  <span aria-hidden>{emoji}</span>
                  <span className="truncate">{wl.name}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${wl.name}`}
                  className="order-2 shrink-0 text-base leading-none opacity-60 hover:opacity-100 min-h-9 min-w-9 sm:order-4"
                  onClick={() => removeWorkload(s.workload_id)}
                >
                  ×
                </button>
                <div className="order-3 flex w-full items-center justify-end gap-3 sm:order-2 sm:w-auto sm:justify-start">
                  <Stepper
                    label={`${wl.name} hours`}
                    value={s.hours_per_day}
                    min={0}
                    max={s.hours_per_day + remaining}
                    unit="h"
                    onChange={(v) => update(s.workload_id, { hours_per_day: v })}
                  />
                  <Stepper
                    label={`${wl.name} days`}
                    value={days}
                    min={1}
                    max={7}
                    unit="d"
                    onChange={(v) => update(s.workload_id, { days_per_week: v })}
                  />
                </div>
                {row && row.kwh > 0 && (
                  <span className="order-4 hidden font-numeric tabular-nums text-xs text-gray-500 sm:order-3 sm:inline">
                    ≈ {formatKwh(row.kwh, 0)}/yr · {formatCost(row.cost, currency)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Idle baseline — always on, shares the 24 h budget with the workloads. */}
      <div className="py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="order-1 font-body font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-1.5 min-w-0 flex-1 basis-40">
            <span aria-hidden>💤</span>
            <span className="truncate">On but idle (desktop / browsing)</span>
          </span>
          <div className="order-3 flex w-full items-center justify-end gap-3 sm:order-2 sm:w-auto sm:justify-start">
            <Stepper
              label="idle hours"
              value={idleHours}
              min={0}
              max={idleHours + remaining}
              unit="h"
              onChange={setIdleHoursPerDay}
            />
          </div>
          {idleRow && idleRow.kwh > 0 && (
            <span className="order-4 hidden font-numeric tabular-nums text-xs text-gray-500 sm:order-3 sm:inline">
              ≈ {formatKwh(idleRow.kwh, 0)}/yr · {formatCost(idleRow.cost, currency)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          The machine is on but not running a workload — this is the biggest hidden cost.
        </p>
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
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1.5 min-h-9 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-brand-dark hover:text-brand-dark transition-colors"
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
          <span className="inline-flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAddOpen(true)}
              disabled={unscheduled.length === 0 || remaining <= 0}
              title={remaining <= 0 ? 'No free hours left — reduce an existing workload first' : undefined}
            >
              + Add workload
            </Button>
            {remaining <= 0 && unscheduled.length > 0 && (
              <span className="text-xs text-gray-500">
                24 h fully booked — reduce a workload to add another.
              </span>
            )}
          </span>
        )}
      </div>
    </Card>
  );
}
