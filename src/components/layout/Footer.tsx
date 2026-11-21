import { Link } from 'react-router-dom';

const LINKS = [
  { to: '/suggestions', label: 'Suggest a part' },
  { to: '/data', label: 'Data freshness' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/about', label: 'About' },
];

/**
 * Secondary destinations that left the top bar when it was pruned to the
 * four first-level pages, plus the disclaimer that used to sit at the foot of
 * every guide article.
 */
export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pb-20 pt-2 text-xs md:px-8 md:pb-8">
      <nav
        aria-label="Secondary"
        className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 dark:text-gray-400"
      >
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="hover:text-brand-dark hover:underline underline-offset-2">
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-gray-500 dark:text-gray-500">
        Figures are estimates for information only — verify specs with manufacturers and your
        utility's tariff card.
      </p>
    </footer>
  );
}
