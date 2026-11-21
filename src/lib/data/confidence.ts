/**
 * How much weight a part's wattage figure deserves.
 *
 * Every component in the catalog carries a `source` string, and those strings
 * are not equal: a vendor's product page states a rated TDP, an independent
 * review measures actual draw, and some entries are our own estimate. Showing
 * which is which is the difference between a specification and a guess.
 */
export type ConfidenceLevel = 'manufacturer' | 'independent' | 'estimated' | 'community';

export interface Confidence {
  level: ConfidenceLevel;
  /** Short label for a badge. */
  label: string;
}

const MANUFACTURER_SOURCES = [
  'amd.com',
  'intel-ark',
  'nvidia.com',
  'vendor-spec',
  'manufacturer',
];

export function confidenceFor(source: string | null | undefined): Confidence {
  const s = (source ?? '').trim().toLowerCase();
  if (!s || s === 'estimate' || s.startsWith('estimat')) {
    return { level: 'estimated', label: 'Estimated' };
  }
  if (s.includes('community') || s.startsWith('user')) {
    return { level: 'community', label: 'Community measurement' };
  }
  if (MANUFACTURER_SOURCES.includes(s)) {
    return { level: 'manufacturer', label: 'Manufacturer spec' };
  }
  // Power figures from a review database are measured, not quoted.
  if (s.includes('techpowerup') || s.includes('review') || s.includes('measure')) {
    return { level: 'independent', label: 'Independent measurement' };
  }
  return { level: 'estimated', label: 'Estimated' };
}

/** Tailwind classes for a badge at each level. */
export const CONFIDENCE_CLASS: Record<ConfidenceLevel, string> = {
  manufacturer:
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  independent:
    'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  community:
    'bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  estimated:
    'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
};
