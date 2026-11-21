import type { ReactNode } from 'react';

/**
 * One page shell for the content pages: the visible h1, an optional one-line
 * summary, and the spacing every page uses beneath it.
 */
export function PageHeader({ title, lede }: { title: ReactNode; lede?: ReactNode }) {
  return (
    <header className="mb-4">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {lede != null && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{lede}</p>
      )}
    </header>
  );
}
