import { NavLink } from 'react-router-dom';

/**
 * Compact brand bar for viewports below `md`, where the main `TopNav` (and its
 * wordmark) is hidden. Non-sticky, so it does not compete with the fixed
 * bottom navigation.
 */
export default function MobileHeader() {
  return (
    <header className="md:hidden flex h-[52px] items-center border-b border-gray-200 dark:border-gray-800 px-4 bg-white dark:bg-gray-950">
      <NavLink to="/" className="font-display text-base font-bold text-brand-dark">
        ⚡ PC Power Calculator
      </NavLink>
    </header>
  );
}
