import { Link } from 'react-router-dom';
import { SITE } from '@/lib/seo/routeMeta';

/** The bare host, for display — SITE carries the scheme. */
const SITE_HOST = SITE.replace(/^https?:\/\//, '');

const LINKS = [
  { to: '/suggest', label: 'Suggest a part' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/data', label: 'Data freshness' },
  { to: '/guides', label: 'Guides' },
  { to: '/help', label: 'Help' },
  { to: '/open-source', label: 'Open source' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/about', label: 'About' },
];

/**
 * Site footer: who runs the site, what it is, and the secondary destinations
 * that left the top bar when it was pruned to the four first-level pages —
 * followed by the disclaimer that governs every figure on the page.
 */
export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl border-t border-gray-200 px-4 pb-20 pt-6 text-xs md:px-8 md:pb-8 dark:border-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-5">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-50">PC Power Calculator</p>
          {/* The app's own address, on every page. It is the one URL a reader
              may want to bookmark or pass on, and it has to match the
              canonical origin the metadata is built from — so it is read from
              SITE rather than typed. */}
          <a
            href={SITE}
            className="mt-0.5 inline-block font-medium text-gray-600 underline-offset-2 hover:underline dark:text-gray-400"
          >
            {SITE_HOST}
          </a>
          <p className="mt-1 leading-relaxed text-gray-500">
            Free PC power consumption and electricity cost calculator.
          </p>
          <p className="mt-2 font-semibold text-gray-600 dark:text-gray-400">
            A product by{' '}
            <a
              href="https://www.concreteinfo.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-text underline-offset-2 hover:underline dark:text-brand-light"
            >
              ConcreteInfo
            </a>
          </p>
          <p className="mt-1 text-gray-500">© 2026 ConcreteInfo. All rights reserved.</p>
        </div>

        <nav
          aria-label="Secondary"
          className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 dark:text-gray-400"
        >
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="underline-offset-2 hover:text-brand-dark hover:underline dark:hover:text-brand-light"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-5 leading-relaxed text-gray-500">
        Figures are estimates for information only — not electrical or financial advice. Power is
        modelled from rated specifications; verify specs with manufacturers and rates with your
        utility's tariff card.
      </p>
    </footer>
  );
}
