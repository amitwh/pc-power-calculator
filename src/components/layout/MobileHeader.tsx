import { NavLink } from 'react-router-dom';

/**
 * Compact brand bar for viewports below `md`, where the main `TopNav` (and its
 * wordmark) is hidden. Non-sticky, so it does not compete with the fixed
 * bottom navigation.
 */
export default function MobileHeader() {
  return (
    <header className="md:hidden flex h-[52px] items-center border-b border-gray-200 dark:border-gray-800 px-4 bg-white dark:bg-gray-950">
      <NavLink
        to="/"
        aria-label="PC Power Calculator"
        className="flex items-center rounded-8 bg-white px-1.5 py-0.5"
      >
        <img
          src="/brand/logo-report.png"
          alt="PC Power Calculator"
          className="h-9 w-auto"
        />
      </NavLink>
    </header>
  );
}
