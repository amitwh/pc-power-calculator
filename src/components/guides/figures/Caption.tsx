/**
 * Shared pieces of every guide figure.
 *
 * These live in their own module so the figure sub-modules can use them
 * without importing the `Figures.tsx` barrel — the barrel imports them back,
 * so the other way round would be a cycle.
 */

/**
 * Ink is `currentColor`, so a figure inherits the page's text colour and
 * reads correctly in light and dark mode without a second set of colours.
 */
export const INK = 'currentColor';

export function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className="mt-2 text-xs leading-relaxed text-gray-500">{children}</figcaption>
  );
}
