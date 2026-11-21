import type { BuildConfig } from '@/types/build';

/**
 * Whether the visitor has actually added a part.
 *
 * The engine always derives a case-fan aggregate, so an "empty" build still has
 * components internally. Any figure computed from that alone (a 4 W peak, a
 * ₹107/year estimate) reads as broken rather than empty, so the results surfaces
 * check the build's own slots instead of the derived component list.
 */
export function hasSelectedParts(build: BuildConfig): boolean {
  return Object.values(build.components).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );
}
