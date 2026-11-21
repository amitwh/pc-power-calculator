import { Link, NavLink } from 'react-router-dom';
import { GUIDE_CATEGORIES, GUIDES } from '@/content/guides';

const items = [
  { to: '/', label: 'Calculator', end: true },
  { to: '/compare', label: 'Compare' },
  { to: '/about', label: 'About' },
];

const PILL =
  'inline-flex h-9 items-center rounded-full px-3.5 font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950';
const INACTIVE =
  'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50';
const ACTIVE =
  'bg-white font-semibold text-brand-text shadow-card dark:bg-gray-800 dark:text-brand-light';

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 hidden border-b border-gray-200/80 bg-white/85 backdrop-blur-md md:block dark:border-gray-800 dark:bg-gray-950/85">
      {/* Inner rail matches the footer (`max-w-7xl px-4 md:px-8`) so the
          wordmark and the footer's first column share one alignment line; the
          header itself stays full-bleed for the border and blur. */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <NavLink
          to="/"
          aria-label="PC Power Calculator"
          className="flex items-center rounded-8 bg-white px-2 py-0.5"
        >
          <img
            src="/brand/logo-report.png"
            alt="PC Power Calculator"
            className="h-11 w-auto"
          />
        </NavLink>

        <nav
          aria-label="Primary"
          className="flex items-center gap-1 rounded-full bg-gray-50 p-1 ring-1 ring-gray-200/70 dark:bg-gray-900/70 dark:ring-gray-800"
        >
          {items.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${PILL} ${isActive ? ACTIVE : INACTIVE}`}
            >
              {item.label}
            </NavLink>
          ))}

          {/* Guides with a menu: the articles are the site's search surface, so
              they belong one hover away rather than only behind the hub. */}
          <details className="group relative">
            <summary
              className={`${PILL} ${INACTIVE} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
            >
              Guides
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                fill="currentColor"
                className="ml-1 h-3.5 w-3.5 transition-transform group-open:rotate-180"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>
            <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-12 border border-gray-200 bg-white p-2 shadow-card-raised dark:border-gray-700 dark:bg-gray-900">
              <Link
                to="/guides"
                className="block rounded-8 px-2.5 py-1.5 text-sm font-semibold text-brand-text hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                All guides →
              </Link>
              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              {/* Why: the guide set is tripling, so a flat list of 25 titles
                  would be unusable. Grouped headings keep it scannable, and
                  the capped height stops the panel running off the screen. */}
              {GUIDE_CATEGORIES.map((category) => {
                const guides = GUIDES.filter((g) => g.category === category.id);
                if (guides.length === 0) return null;
                return (
                  <div key={category.id} className="mb-1">
                    <p className="px-2.5 pt-1.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {category.label}
                    </p>
                    {guides.map((g) => (
                      <Link
                        key={g.slug}
                        to={`/guides/${g.slug}`}
                        className="block rounded-8 px-2.5 py-1.5 text-[13px] leading-snug text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        {g.title}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </details>

          {items.slice(2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${PILL} ${isActive ? ACTIVE : INACTIVE}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
