import { NavLink } from 'react-router-dom';

/**
 * Compact brand bar for viewports below `md`, where the main `TopNav` (and its
 * wordmark) is hidden. Non-sticky, so it does not compete with the fixed
 * bottom navigation.
 */
export default function MobileHeader() {
  return (
    <header className="md:hidden flex h-[52px] items-center border-b border-gray-200 dark:border-gray-800 px-4 bg-white dark:bg-gray-950">
      <NavLink to="/" aria-label="PC Power Calculator" className="flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-8 bg-brand/10 text-lg"
        >
          ⚡
        </span>
        <span className="font-display text-base font-bold tracking-tight">
          PC Power <span className="text-brand-text dark:text-brand-light">Calculator</span>
        </span>
      </NavLink>
    </header>
  );
}
