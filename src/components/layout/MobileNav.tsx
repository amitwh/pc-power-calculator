import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Calc', end: true },
  { to: '/compare', label: 'Compare' },
  { to: '/guides', label: 'Guides' },
  { to: '/about', label: 'About' },
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
            `font-body text-xs flex flex-col items-center px-1.5 min-w-[44px] min-h-[44px] justify-center rounded-12 ${isActive ? 'bg-brand/10 text-brand-text font-semibold' : 'text-gray-700 dark:text-gray-300'}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
