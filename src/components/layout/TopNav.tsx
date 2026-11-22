import { Link, NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { GUIDE_CATEGORIES, GUIDE_CATEGORY_STYLES, GUIDES } from '@/content/guides';
import { OPEN_SOURCE_NAV_PROJECTS } from '@/content/openSource';
import { useDropdownMenu } from '@/hooks/useDropdownMenu';

// The nav order is Calculator · Compare · Guides · Open source · Help · About.
// The two menus are rendered in that order, so the plain links are held in two
// lists — the ones above the menus and the ones below them.
interface NavItem {
  to: string;
  label: string;
  /** Match the path exactly — the home link must not stay active on /compare. */
  end?: boolean;
}

const LEAD_ITEMS: NavItem[] = [
  { to: '/', label: 'Calculator', end: true },
  { to: '/compare', label: 'Compare' },
];

const TAIL_ITEMS: NavItem[] = [
  { to: '/help', label: 'Help' },
  { to: '/about', label: 'About' },
];

const PILL =
  'inline-flex h-9 items-center rounded-full px-3.5 font-body text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950';
// Why: the pills sit in a `bg-gray-50` rail, so a white hover was invisible.
// A brand tint gives the hovered link the same "this is live" signal the
// mobile nav uses.
const INACTIVE =
  'text-gray-600 hover:bg-brand/10 hover:text-brand-text dark:text-gray-300 dark:hover:bg-brand/15 dark:hover:text-brand-light';
const ACTIVE =
  'bg-white font-semibold text-brand-text shadow-card dark:bg-gray-800 dark:text-brand-light';
const TRIGGER_OPEN =
  'bg-brand/10 font-semibold text-brand-text hover:bg-brand/15 dark:bg-brand/15 dark:text-brand-light';

/**
 * Deal the category groups into two columns of roughly equal height.
 *
 * Why: the three groups are very different sizes — hardware alone is half the
 * set — so dropping them into two fixed columns leaves one column far taller
 * than the other and the panel scrolls for no reason. Each group goes to
 * whichever column is currently shorter, which balances the two and keeps the
 * whole set on one screen.
 */
function splitIntoColumns<T extends { guides: unknown[] }>(groups: T[]): T[][] {
  const columns: T[][] = [[], []];
  const heights = [0, 0];
  for (const group of groups) {
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push(group);
    heights[target] += group.guides.length;
  }
  return columns;
}

/**
 * The Guides menu.
 *
 * Why a controlled dropdown and not `<details>`: the browser owns a details
 * element's open state, so navigating from a link inside it leaves the panel
 * hanging open over the article. React owns the state here, so a click can
 * close the menu on the way out. The mechanics live in `useDropdownMenu`, so
 * the open-source menu below behaves identically.
 */
function GuidesMenu() {
  const { open, containerRef, triggerRef, toggle, close, handlePointerEnter, handlePointerLeave } =
    useDropdownMenu();

  const groups = GUIDE_CATEGORIES.map((category) => ({
    category,
    guides: GUIDES.filter((g) => g.category === category.id),
  })).filter((group) => group.guides.length > 0);
  const columns = splitIntoColumns(groups);

  return (
    <div ref={containerRef} className="relative" onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
        className={`${PILL} ${open ? TRIGGER_OPEN : INACTIVE} cursor-pointer`}
      >
        Guides
        <ChevronDown
          aria-hidden
          className={`ml-1 h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        // The wrapper carries the hover bridge: its transparent top padding
        // keeps the pointer inside the container while it travels from the
        // trigger down to the panel, so the menu never flickers shut
        // mid-movement.
        <div className="absolute right-0 top-full z-50 w-fit pt-2">
          <div className="max-h-[75vh] w-[44rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-12 border border-gray-200 bg-white p-2 shadow-card-raised dark:border-gray-700 dark:bg-gray-900">
            <Link
              to="/guides"
              onClick={() => close()}
              // Why `dark:text-orange-300`: --color-brand-text is #a82d15,
              // which reaches only 1.4:1 on the gray-900 dark panel — the
              // same lift the guide rows and the open-source panel use.
              className="block rounded-8 px-2.5 py-1.5 text-sm font-semibold text-brand-text hover:bg-gray-50 dark:text-orange-300 dark:hover:bg-gray-800"
            >
              All guides →
            </Link>
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
            {/* Why two columns: the guide set is 26 articles long, and a single
                scrolling column with wrapped titles was unusable. Two columns
                of one-line rows fit the whole set on one screen. */}
            <div className="grid grid-cols-2 gap-6">
              {columns.map((column, columnIndex) => (
                <div key={columnIndex}>
                  {column.map(({ category, guides }) => {
                    const style = GUIDE_CATEGORY_STYLES[category.id];
                    return (
                      <section key={category.id} className="mb-3">
                        <h3
                          className={`px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide ${style.heading}`}
                        >
                          {category.label}
                        </h3>
                        <ul>
                          {guides.map((g) => (
                            <li key={g.slug}>
                              <Link
                                to={`/guides/${g.slug}`}
                                onClick={() => close()}
                                className="group flex items-center gap-2.5 rounded-8 px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-8 ${style.tile}`}
                                >
                                  <g.icon aria-hidden className={`h-4 w-4 ${style.icon}`} />
                                </span>
                                <span
                                  title={g.title}
                                  className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-snug text-gray-700 group-hover:text-brand-text dark:text-gray-300 dark:group-hover:text-orange-300"
                                >
                                  {g.title}
                                </span>
                                <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                                  {g.minutes} min
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The open-source menu.
 *
 * Why the project rows leave the site: they are other projects, on other
 * domains, and the reader is browsing a directory — so each one opens beside
 * the directory rather than replacing it.
 */
function OpenSourceMenu() {
  const { open, containerRef, triggerRef, toggle, close, handlePointerEnter, handlePointerLeave } =
    useDropdownMenu();

  return (
    <div ref={containerRef} className="relative" onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
        className={`${PILL} ${open ? TRIGGER_OPEN : INACTIVE} cursor-pointer`}
      >
        Open source
        <ChevronDown
          aria-hidden
          className={`ml-1 h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        // The wrapper carries the hover bridge — its transparent top padding
        // keeps the pointer inside the container while it travels from the
        // trigger down to the panel.
        <div className="absolute right-0 top-full z-50 w-fit pt-2">
          <div className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-12 border border-gray-200 bg-white p-2 shadow-card-raised dark:border-gray-700 dark:bg-gray-900">
            <ul>
              {OPEN_SOURCE_NAV_PROJECTS.map((project) => {
                const Icon = project.icon;
                return (
                  <li key={project.id}>
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2.5 rounded-8 px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-8 ${project.tile}`}
                      >
                        <Icon aria-hidden className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-snug text-gray-700 group-hover:text-brand-text dark:text-gray-300 dark:group-hover:text-orange-300">
                          {project.name}
                        </span>
                        {/* Why gray-300 and not gray-400 on the dark panel:
                            gray-400 is #b0b0b0 on the gray-900 panel — 4.35:1,
                            just under the 4.5:1 that 12px text needs. */}
                        <span className="mt-0.5 block text-[12px] leading-snug text-gray-500 dark:text-gray-300">
                          {project.short}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
            {/* The directory itself: it is the one in-site destination, so it
                opens in the same tab.
                Why `dark:text-orange-300`: --color-brand-text is #a82d15,
                which reaches only 1.4:1 on the gray-900 dark panel. */}
            <Link
              to="/open-source"
              onClick={() => close()}
              className="block rounded-8 px-2.5 py-1.5 text-sm font-semibold text-brand-text hover:bg-gray-50 dark:text-orange-300 dark:hover:bg-gray-800"
            >
              All open-source projects →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

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
          {LEAD_ITEMS.map((item) => (
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
          <GuidesMenu />

          {/* The other open-source projects, one hover away: a reader who
              wants the Git client or the curve fitter should not have to
              find the directory page first. */}
          <OpenSourceMenu />

          {TAIL_ITEMS.map((item) => (
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
