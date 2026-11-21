import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { listWorkloads } from '@/lib/data/workloads';
import { Card } from '@/components/ui/Card';
import { HelpTip } from '@/components/ui/HelpTip';
import { workloadHex } from '@/lib/categoryColors';
import type { WorkloadSchedule, Workload } from '@/types/workload';

/**
 * The day, as a proportion bar: one segment per use case plus the idle
 * baseline, sized against a 24-hour day so a half-empty day looks half-empty.
 */
function DayBar({ segments }: { segments: Array<{ key: string; hours: number; hex: string }> }) {
  return (
    <div
      aria-hidden
      className="mt-3 flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
    >
      {segments
        .filter((s) => s.hours > 0)
        .map((s) => (
          <i
            key={s.key}
            className="block h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(s.hours / 24) * 100}%`, background: s.hex }}
          />
        ))}
    </div>
  );
}

/** A use case picker that reads as text until you touch it. */
function UseCaseSelect({
  value,
  workloads,
  onChange,
  label,
}: {
  value: string;
  workloads: Workload[];
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <span
      className="relative w-[8rem] min-w-0 shrink-0 sm:w-[10rem]"
      title="Change the use case for this row"
    >
      <select
        aria-label={label}
        title="Change the use case for this row"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer truncate rounded-4 border border-transparent bg-transparent py-0.5 pl-0 pr-5 text-sm font-semibold text-gray-900 hover:border-gray-300 hover:bg-white focus:border-brand focus:outline-none dark:text-gray-50 dark:hover:bg-gray-900"
      >
        {workloads.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-400"
      >
        ▾
      </span>
    </span>
  );
}

export function ScheduleEditor() {
  const buildId = useBuildStore((s) => s.activeBuildId);
  const builds = useBuildStore((s) => s.builds);
  const setSchedule = useBuildStore((s) => s.setSchedule);
  const setIdleHoursPerDay = useBuildStore((s) => s.setIdleHoursPerDay);
  const workloads = useMemo(() => listWorkloads(), []);
  const workloadMap = useMemo(() => new Map(workloads.map((w) => [w.id, w])), [workloads]);
  const build = builds.find((b) => b.id === buildId);
  const schedule = build?.schedule ?? [];
  const idleHours = build?.idle_hours_per_day ?? 0;
  const scheduledIds = new Set(schedule.map((s) => s.workload_id));

  const dailyHours =
    schedule.reduce((acc: number, s: WorkloadSchedule) => acc + s.hours_per_day, idleHours);
  const overBudget = dailyHours > 24 + 1e-9;
  // Hours the day still has free; caps every slider.
  const remaining = Math.max(0, 24 - dailyHours);

  const update = (id: string, patch: Partial<WorkloadSchedule>) =>
    setSchedule(schedule.map((s) => (s.workload_id === id ? { ...s, ...patch } : s)));

  /**
   * Swap the use case on a row. If the target is already scheduled the two rows
   * exchange places, so nothing is lost and no duplicate is created.
   */
  const changeUseCase = (oldId: string, newId: string) => {
    if (oldId === newId) return;
    const taken = scheduledIds.has(newId as Workload['id']);
    setSchedule(
      schedule.map((s) => {
        if (s.workload_id === oldId) return { ...s, workload_id: newId as Workload['id'] };
        if (taken && s.workload_id === newId) return { ...s, workload_id: oldId as Workload['id'] };
        return s;
      }),
    );
  };

  const addWorkload = (id: string) => {
    if (!id || scheduledIds.has(id as Workload['id'])) return;
    setSchedule([
      ...schedule,
      {
        workload_id: id as Workload['id'],
        hours_per_day: Math.min(2, remaining),
        days_per_week: 7,
      },
    ]);
  };

  const removeWorkload = (id: string) =>
    setSchedule(schedule.filter((s) => s.workload_id !== id));

  const unscheduled = workloads.filter((w) => !scheduledIds.has(w.id));

  const segments = [
    ...schedule.map((s) => ({
      key: s.workload_id,
      hours: s.hours_per_day,
      hex: workloadHex(workloadMap.get(s.workload_id)?.category),
    })),
    { key: 'idle', hours: idleHours, hex: '#d1d1d1' },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1">
          <h2 className="font-display text-base font-bold">When you use it</h2>
          <HelpTip
            align="left"
            label="About the schedule"
            text="Hours per day at each workload; use 'On, but idle' for the rest of the time the PC is on."
          />
        </span>
        <span
          className={`font-numeric text-xs tabular-nums ${
            overBudget ? 'font-bold text-red-600 dark:text-red-400' : 'text-gray-500'
          }`}
        >
          {dailyHours.toFixed(dailyHours % 1 === 0 ? 0 : 1)} of 24 h
        </span>
      </div>

      <DayBar segments={segments} />

      {overBudget && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
          {dailyHours.toFixed(1)} h in a day — a day only has 24.
        </p>
      )}

      {schedule.length === 0 && idleHours === 0 && (
        <p className="mt-3 text-sm text-gray-500">Pick a use case to see what the day costs.</p>
      )}

      <ul className="mt-2">
        {schedule.map((s: WorkloadSchedule) => {
          const wl = workloadMap.get(s.workload_id);
          if (!wl) return null;
          const hex = workloadHex(wl.category);
          return (
            <li
              key={s.workload_id}
              className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-gray-100 py-1.5 first:border-t-0 dark:border-gray-800"
            >
              <i className="h-2 w-2 shrink-0 rounded-sm" style={{ background: hex }} aria-hidden />
              <UseCaseSelect
                value={s.workload_id}
                label={`Use case (${wl.name})`}
                workloads={workloads}
                onChange={(id) => changeUseCase(s.workload_id, id)}
              />

              <input
                type="range"
                min={0}
                max={s.hours_per_day + remaining}
                step={1}
                value={s.hours_per_day}
                aria-label={`${wl.name} hours per day`}
                title={`${wl.name}: hours per day`}
                onChange={(e) => update(s.workload_id, { hours_per_day: Number(e.target.value) })}
                className="h-1.5 min-w-[3rem] flex-1 cursor-pointer accent-brand"
              />
              <span className="w-12 shrink-0 text-right font-numeric text-sm font-semibold tabular-nums">
                {s.hours_per_day}
                <span className="ml-0.5 text-xs font-normal text-gray-500">h</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${wl.name}`}
                title={`Remove ${wl.name} from the schedule`}
                onClick={() => removeWorkload(s.workload_id)}
                className="h-7 w-6 shrink-0 text-base leading-none text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              >
                ×
              </button>
            </li>
          );
        })}

        {/* Idle keeps its own row: it is a way the machine is used, not a use case. */}
        <li className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-gray-100 py-1.5 dark:border-gray-800">
          <i className="h-2 w-2 shrink-0 rounded-sm bg-gray-300 dark:bg-gray-600" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
            On, but idle
          </span>
          <input
            type="range"
            min={0}
            max={idleHours + remaining}
            step={1}
            value={idleHours}
            aria-label="Idle hours per day"
            title="Hours per day the PC is on but idle"
            onChange={(e) => setIdleHoursPerDay(Number(e.target.value))}
            className="h-1.5 min-w-[3rem] flex-1 cursor-pointer accent-brand"
          />
          <span className="w-12 shrink-0 text-right font-numeric text-sm font-semibold tabular-nums">
            {idleHours}
            <span className="ml-0.5 text-xs font-normal text-gray-500">h</span>
          </span>
          <span className="w-6 shrink-0" aria-hidden />
        </li>
      </ul>

      {/* Adding a use case is a dropdown, not a paragraph of buttons. */}
      <select
        aria-label="Add a use case"
        title="Add another workload to the day"
        value=""
        disabled={unscheduled.length === 0 || remaining <= 0}
        onChange={(e) => addWorkload(e.target.value)}
        className="mt-2 w-full cursor-pointer rounded-8 border border-dashed border-gray-300 bg-transparent px-2.5 py-1.5 text-sm font-semibold text-gray-600 hover:border-brand hover:text-brand-text disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
      >
        <option value="">
          {remaining <= 0
            ? '24 h booked — free some hours first'
            : unscheduled.length === 0
              ? 'Every use case is scheduled'
              : '+ Add a use case…'}
        </option>
        {unscheduled.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </Card>
  );
}
