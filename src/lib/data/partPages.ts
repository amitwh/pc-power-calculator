import type { Component } from '@/types/component';
import { listComponents } from './components';

/**
 * First release year that earns a `/parts/:id` page in tranche 1.
 *
 * Part pages carry real computed numbers, but publishing all 2,241 catalog
 * entries at once risks Google reading them as thin/auto-generated content.
 * Tranche 1 therefore covers only recent CPUs and GPUs with a known TDP.
 */
export const PART_PAGE_MIN_YEAR = 2022;

/**
 * Whether a part belongs in the current `/parts/:id` tranche.
 *
 * Tranche 1 exists to avoid the thin-content risk: only CPUs and GPUs with a
 * rated TDP, released in {@link PART_PAGE_MIN_YEAR} or later. Widen the year or
 * add categories only after Search Console shows the previous tranche
 * indexing.
 */
export function isIndexablePart(c: Component): boolean {
  return (
    (c.category === 'cpu' || c.category === 'gpu') &&
    c.tdp_w != null &&
    c.releaseYear >= PART_PAGE_MIN_YEAR
  );
}

/** Every catalog part that belongs in the current `/parts/:id` tranche. */
export function indexableParts(): Component[] {
  return listComponents().filter(isIndexablePart);
}
