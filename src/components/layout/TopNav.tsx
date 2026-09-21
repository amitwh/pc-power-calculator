import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Calculator', end: true },
  { to: '/compare', label: 'Compare' },
  { to: '/suggestions', label: 'Suggest' },
  { to: '/data', label: 'Data' },
  { to: '/about', label: 'About' },
];

export default function TopNav() {
  return (
    <header className="hidden md:flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 bg-white dark:bg-gray-950">
      <NavLink to="/" className="font-display text-xl font-bold text-brand">⚡ PC Power Calculator</NavLink>
      <nav className="flex gap-6">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `font-body text-sm ${isActive ? 'text-brand font-semibold' : 'text-gray-700 dark:text-gray-300 hover:text-brand'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
