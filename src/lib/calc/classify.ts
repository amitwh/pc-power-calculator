import type { BuildCategory } from '@/types/build';
import type { Component } from '@/types/component';

/** A consumption band, from a desk-only machine to an always-on rack. */
export interface ConsumptionTier {
  key: 'standby' | 'light' | 'everyday' | 'performance' | 'workstation' | 'heavy';
  label: string;
  /** Inclusive lower bound (average wall watts). */
  from: number;
  /** Exclusive upper bound; null on the top band. */
  to: number | null;
  /** One line on what living in this band means. */
  blurb: string;
}

export const CONSUMPTION_TIERS: ConsumptionTier[] = [
  { key: 'standby', label: 'Barely on', from: 0, to: 15,
    blurb: 'Mostly asleep. Your bill is dominated by everything else in the house.' },
  { key: 'light', label: 'Light', from: 15, to: 60,
    blurb: 'A laptop-class load. A few hours a day is a rounding error on an Indian bill.' },
  { key: 'everyday', label: 'Everyday', from: 60, to: 150,
    blurb: 'A desktop doing real work. Cost tracks your hours more than your parts.' },
  { key: 'performance', label: 'Performance', from: 150, to: 300,
    blurb: 'A gaming or creative machine. The GPU sets the floor, not the CPU.' },
  { key: 'workstation', label: 'Workstation', from: 300, to: 600,
    blurb: 'Renders, simulations, training runs. Every hour is real money.' },
  { key: 'heavy', label: 'Always-on heavy', from: 600, to: null,
    blurb: 'A server that never sleeps. Idle wattage is the whole bill.' },
];

/** Average wall draw implied by a year's energy, across all 8,760 hours. */
export function averageWallW(kwhPerYear: number): number {
  return (kwhPerYear * 1000) / (365 * 24);
}

/** Hours a year the machine is actually powered on, from its schedule. */
export function onHoursPerYear(build: {
  schedule: Array<{ hours_per_day: number; days_per_week?: number }>;
  idle_hours_per_day?: number;
}): number {
  const perDay =
    build.schedule.reduce((acc, s) => acc + s.hours_per_day * ((s.days_per_week ?? 7) / 7), 0) +
    (build.idle_hours_per_day ?? 0);
  return Math.max(1, perDay * 365);
}

/**
 * Draw while the machine is on — the number a person means when they say
 * "my PC uses about X watts". Averaging over 8,760 hours instead puts a
 * 12-hours-a-day gaming PC in the laptop band, which is misleading.
 */
export function typicalDrawW(
  kwhPerYear: number,
  build: { schedule: Array<{ hours_per_day: number; days_per_week?: number }>; idle_hours_per_day?: number },
): number {
  return (kwhPerYear * 1000) / onHoursPerYear(build);
}

export function tierFor(avgW: number): ConsumptionTier {
  return (
    CONSUMPTION_TIERS.find((t) => avgW >= t.from && (t.to == null || avgW < t.to)) ??
    CONSUMPTION_TIERS[CONSUMPTION_TIERS.length - 1]
  );
}

/** Where on the 0–100 gauge the marker sits (log-ish, so 10 W and 900 W both read). */
export function tierPosition(avgW: number): number {
  // 0 W → 0, 1000 W → 100, square-root curve so the low bands are not crushed.
  return Math.max(0, Math.min(100, Math.sqrt(Math.max(0, avgW) / 1000) * 100));
}

export interface CategorySuggestion {
  category: BuildCategory;
  /** Why the rules landed there — shown next to the guess. */
  reason: string;
}

interface Signals {
  gpuW: number;
  cpuCores: number;
  ramGb: number;
  drives: number;
  alwaysOn: boolean;
  gamingHours: number;
  renderHours: number;
  aiHours: number;
}

function signalsFrom(build: { schedule: Array<{ workload_id: string; hours_per_day: number; days_per_week?: number }>; idle_hours_per_day?: number }, raw: Component[]): Signals {
  const sumW = (cat: string) =>
    raw.filter((c) => c.category === cat).reduce((a, c) => a + (Number(c.tdp_w) || 0), 0);

  const hoursFor = (ids: string[]) =>
    build.schedule
      .filter((s) => ids.some((id) => s.workload_id.startsWith(id)))
      .reduce((a, s) => a + s.hours_per_day, 0);

  const scheduledHours = build.schedule.reduce((a, s) => a + s.hours_per_day, 0);
  const alwaysOn =
    (build.idle_hours_per_day ?? 0) + scheduledHours >= 20 ||
    build.schedule.some((s) => s.days_per_week === 7 && s.hours_per_day >= 12);

  const cores = raw
    .filter((c) => c.category === 'cpu')
    .reduce((a, c) => a + (Number(c.specs.cores) || 0), 0);
  const ramGb = raw
    .filter((c) => c.category === 'ram')
    .reduce((a, c) => a + (Number(c.specs.capacity_gb) || 0), 0);

  return {
    gpuW: sumW('gpu'),
    cpuCores: cores,
    ramGb,
    drives: raw.filter((c) => c.category === 'storage').length,
    alwaysOn,
    gamingHours: hoursFor(['gaming']),
    renderHours: hoursFor(['render', 'video', 'photo']),
    aiHours: hoursFor(['llm', 'training']),
  };
}

/**
 * Guess what the machine is for from its parts and its schedule, and say why.
 *
 * This is a heuristic, not a verdict — the build carries its own category the
 * visitor chose. It exists so the page can say "this looks like a NAS" when
 * the numbers (always on, four drives, no GPU) clearly point that way.
 */
export function suggestCategory(
  build: {
    category?: BuildCategory;
    schedule: Array<{ workload_id: string; hours_per_day: number; days_per_week?: number }>;
    idle_hours_per_day?: number;
  },
  raw: Component[],
): CategorySuggestion {
  const s = signalsFrom(build, raw);

  if (s.drives >= 4 && s.gpuW < 100) {
    return { category: 'nas', reason: `${s.drives} drives and no serious GPU — that is a storage box.` };
  }
  if (s.aiHours > 0 || (s.ramGb >= 64 && s.gpuW >= 200)) {
    return { category: 'ai', reason: 'A large GPU with 64 GB or more of memory pointed at model work.' };
  }
  if (s.alwaysOn && s.gpuW < 150) {
    return { category: 'homelab', reason: 'On around the clock with no big GPU — a host running services.' };
  }
  if (s.gpuW >= 150) {
    return {
      category: 'gaming',
      reason: `A ${Math.round(s.gpuW)} W GPU${s.gamingHours > 0 ? ' with gaming on the schedule' : ' — the profile is GPU-led'}.`,
    };
  }
  if (s.renderHours > 0) {
    return { category: 'content', reason: 'Rendering and editing hours on the schedule.' };
  }
  if (s.gpuW < 100 && s.cpuCores >= 12) {
    return { category: 'workstation', reason: `${s.cpuCores} CPU cores and no discrete GPU.` };
  }
  return { category: build.category ?? 'general', reason: 'Nothing dominates the profile yet.' };
}
