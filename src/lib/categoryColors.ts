import type { ComponentCategory } from '@/types/component';

/**
 * One color identity per component category, shared by the devices cart
 * (badge + left bar), the power-breakdown donut (hex), and the PDF report
 * (print-safe RGB). Class strings must stay literal for Tailwind's scanner.
 */
export interface CategoryColor {
  /** Tailwind classes for the row badge (light tint bg + readable text). */
  badge: string;
  /** Tailwind class for the row's left accent border. */
  bar: string;
  /** Chart color (500-range). */
  hex: string;
  /** Print-legible RGB triplet for the PDF (700-range). */
  pdf: [number, number, number];
}

export const CATEGORY_COLORS: Record<ComponentCategory, CategoryColor> = {
  cpu: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    bar: 'border-l-amber-400',
    hex: '#f59e0b',
    pdf: [180, 83, 9],
  },
  gpu: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    bar: 'border-l-red-400',
    hex: '#ef4444',
    pdf: [185, 28, 28],
  },
  motherboard: {
    badge: 'bg-slate-200 text-slate-800 dark:bg-slate-500/25 dark:text-slate-300',
    bar: 'border-l-slate-400',
    hex: '#64748b',
    pdf: [71, 85, 105],
  },
  ram: {
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
    bar: 'border-l-violet-400',
    hex: '#8b5cf6',
    pdf: [109, 40, 217],
  },
  storage: {
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
    bar: 'border-l-cyan-400',
    hex: '#06b6d4',
    pdf: [14, 116, 144],
  },
  psu: {
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    bar: 'border-l-yellow-400',
    hex: '#eab308',
    pdf: [161, 98, 7],
  },
  cooler: {
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
    bar: 'border-l-sky-400',
    hex: '#0ea5e9',
    pdf: [3, 105, 161],
  },
  fan: {
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300',
    bar: 'border-l-teal-400',
    hex: '#14b8a6',
    pdf: [15, 118, 110],
  },
  monitor: {
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300',
    bar: 'border-l-indigo-400',
    hex: '#6366f1',
    pdf: [67, 56, 202],
  },
  add_in_card: {
    badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-300',
    bar: 'border-l-fuchsia-400',
    hex: '#d946ef',
    pdf: [162, 28, 175],
  },
  optical_drive: {
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-500/20 dark:text-lime-300',
    bar: 'border-l-lime-400',
    hex: '#84cc16',
    pdf: [77, 124, 15],
  },
  ups: {
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    bar: 'border-l-orange-400',
    hex: '#f97316',
    pdf: [194, 65, 12],
  },
  peripheral: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    bar: 'border-l-emerald-400',
    hex: '#10b981',
    pdf: [4, 108, 78],
  },
};

const FALLBACK: CategoryColor = {
  badge: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
  bar: 'border-l-gray-400',
  hex: '#9ca3af',
  pdf: [107, 114, 128],
};

/** Color for a category, with a neutral fallback for unknown values. */
export function categoryColor(cat: ComponentCategory | string): CategoryColor {
  return (CATEGORY_COLORS as Record<string, CategoryColor>)[cat] ?? FALLBACK;
}
