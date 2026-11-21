import { useMemo, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { listWorkloads } from '@/lib/data/workloads';
import { computeEnergy } from '@/lib/calc/energy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCost } from '@/lib/calc/format';
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
    'h-8 w-7 rounded-8 border border-gray-300 dark:border-gray-700 text-base leading-none opacity-80 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed';
  return (
    <span className="inline-flex items-center gap-0.5" role="group" aria-label={label}>
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
        className="font-numeric tabular-nums text-sm w-10 text-center whitespace-nowrap"
      >
        {value}
        <span className="ml-0.5 text-xs text-gray-500">{unit}</span>
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
    <Card className="p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold">Usage</h2>
        <span
          className={`font-numeric tabular-nums text-xs ${
            overBudget ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-500'
          }`}
        >
          {dailyHours.toFixed(1)} h/day booked{anyPartWeek && !overBudget ? ` · ${avgHours.toFixed(1)} h/day avg` : ''}
          {!overBudget && remaining > 0 ? ` · ${remaining.toFixed(1)} free` : ''}
        </span>
      </div>

      {overBudget && (
        <p
          role="alert"
          className="mb-2 rounded-8 border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300"
        >
          {dailyHours.toFixed(1)} h in a day — a day only has 24. Lower a workload; until then the
          estimate is overstated.
        </p>
      )}

      {schedule.length === 0 && (
        <p className="mb-2 text-sm text-gray-500">
          No usage scheduled — add a workload to estimate energy use.
        </p>
      )}

      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {schedule.map((s: WorkloadSchedule) => {
          const wl = workloadMap.get(s.workload_id);
          if (!wl) return null;
          const emoji = CATEGORY_EMOJI[wl.category] ?? '⚙️';
          const days = s.days_per_week ?? 7;
          const row = yearlyByWorkload[s.workload_id];
          return (
            <li key={s.workload_id} className="flex items-center gap-2 py-0.5 text-sm">
              <span className="flex min-w-0 flex-1 items-center gap-1.5 font-medium text-gray-900 dark:text-gray-50">
                <span aria-hidden>{emoji}</span>
                {/* The one place the full name is allowed to wrap: the row
                    must stay one line tall on a phone. */}
                <span className="truncate" title={wl.name}>{wl.name}</span>
              </span>
              {/* Cost sits next to the name, not out at the right edge, so the
                  row reads name → what it costs → the controls that change it. */}
              <span className="hidden w-[4.5rem] shrink-0 text-right font-numeric tabular-nums text-xs text-gray-500 sm:block">
                {row && row.kwh > 0 ? formatCost(row.cost, currency) : ''}
              </span>
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
              <button
                type="button"
                aria-label={`Remove ${wl.name}`}
                className="h-8 w-7 shrink-0 text-base leading-none opacity-60 hover:opacity-100"
                onClick={() => removeWorkload(s.workload_id)}
              >
                ×
              </button>
            </li>
          );
        })}

        {/* Idle baseline — always on, shares the 24 h budget with the workloads. */}
        <li className="flex items-center gap-2 py-0.5 text-sm">
          <span
            className="flex min-w-0 flex-1 items-center gap-1.5 font-medium text-gray-900 dark:text-gray-50"
            title="On but not running a workload — the biggest hidden cost"
          >
            <span aria-hidden>💤</span>
            <span className="truncate">Idle</span>
          </span>
          <span className="hidden w-[4.5rem] shrink-0 text-right font-numeric tabular-nums text-xs text-gray-500 sm:block">
            {idleRow && idleRow.kwh > 0 ? formatCost(idleRow.cost, currency) : ''}
          </span>
          <Stepper
            label="idle hours"
            value={idleHours}
            min={0}
            max={idleHours + remaining}
            unit="h"
            onChange={setIdleHoursPerDay}
          />
          {/* No day-count control for idle: it runs every day. The spacer keeps
              the hour stepper aligned with the rows above. */}
          <span className="w-[3.5rem] shrink-0" aria-hidden />
        </li>
      </ul>

      {/* Add workload */}
      <div className="mt-2">
        {addOpen ? (
          <div className="rounded-8 border border-gray-200 p-2 space-y-1.5 dark:border-gray-800">
            {Object.entries(byCategory).map(([cat, list]) => (
              <div key={cat} className="flex flex-wrap items-center gap-1.5">
                <span className="w-[6.5rem] shrink-0 text-xs font-semibold text-gray-500">
                  {CATEGORY_EMOJI[cat] ?? '⚙️'} {CATEGORY_LABEL[cat] ?? cat}
                </span>
                {list.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => addWorkload(w.id)}
                    title={w.description}
                    className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-brand-dark hover:text-brand-dark dark:border-gray-700 dark:text-gray-300"
                  >
                    + {w.name}
                  </button>
                ))}
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAddOpen(true)}
              disabled={unscheduled.length === 0 || remaining <= 0}
              title={remaining <= 0 ? 'No free hours left — reduce an existing workload first' : undefined}
            >
              + Workload
            </Button>
            {remaining <= 0 && unscheduled.length > 0 && (
              <span className="text-xs text-gray-500">24 h booked — free some hours first.</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
