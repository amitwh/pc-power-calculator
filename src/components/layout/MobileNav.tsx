import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Calc', end: true },
  { to: '/compare', label: 'Compare' },
  { to: '/suggestions', label: 'Suggest' },
  { to: '/guides', label: 'Guides' },
  { to: '/data', label: 'Data' },
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
];

export default function MobileNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex justify-around py-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `font-body text-xs flex flex-col items-center px-1.5 min-w-[44px] min-h-[44px] justify-center ${isActive ? 'text-brand-dark font-semibold' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
