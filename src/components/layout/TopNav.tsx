import { Link, NavLink } from 'react-router-dom';
import { GUIDES } from '@/pages/Guides';

const items = [
  { to: '/', label: 'Calculator', end: true },
  { to: '/compare', label: 'Compare' },
  { to: '/about', label: 'About' },
];

export default function TopNav() {
  return (
    <header className="hidden md:flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 bg-white dark:bg-gray-950">
      <NavLink to="/" className="font-display text-xl font-bold text-brand-dark">⚡ PC Power Calculator</NavLink>
      <nav className="flex items-center gap-6">
        {items.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `font-body text-sm ${isActive ? 'text-brand-dark font-semibold' : 'text-gray-700 dark:text-gray-300 hover:text-brand-dark'}`
            }
          >
            {item.label}
          </NavLink>
        ))}

        {/* Guides with a menu: the articles are the site's search surface, so
            they belong one hover away rather than only behind the hub. */}
        <details className="relative group">
          <summary className="cursor-pointer list-none font-body text-sm text-gray-700 hover:text-brand-dark dark:text-gray-300 [&::-webkit-details-marker]:hidden">
            Guides <span aria-hidden className="text-[10px] align-middle">▾</span>
          </summary>
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-12 border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <Link
              to="/guides"
              className="block rounded-8 px-2.5 py-1.5 text-sm font-semibold text-brand-text hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              All guides →
            </Link>
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                to={`/guides/${g.slug}`}
                className="block rounded-8 px-2.5 py-1.5 text-[13px] leading-snug text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {g.title}
              </Link>
            ))}
          </div>
        </details>

        {items.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `font-body text-sm ${isActive ? 'text-brand-dark font-semibold' : 'text-gray-700 dark:text-gray-300 hover:text-brand-dark'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
