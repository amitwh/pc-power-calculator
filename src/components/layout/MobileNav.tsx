import { NavLink } from 'react-router-dom';
import { BookOpen, Calculator, CircleHelp, Code2, GitCompareArrows, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// The icon names are the ones lucide-react 1.77.0 actually exports — the
// library dropped the brand glyphs (Github, Linkedin, Youtube) in that
// release, so every name here was checked against the installed package
// rather than assumed.
const items: {
  to: string;
  label: string;
  /** The label for the narrow screens, where the full one cannot fit. */
  short?: string;
  end?: boolean;
  icon: LucideIcon;
}[] = [
  { to: '/', label: 'Calc', end: true, icon: Calculator },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
  { to: '/guides', label: 'Guides', icon: BookOpen },
  // Why the short label: six tabs in a 320px viewport leave about 51px each,
  // and "Open source" measures 62px at this size — it would wrap to two
  // lines and break the one-line row. "Source" fits, and the desktop label
  // stays the full "Open source".
  { to: '/open-source', label: 'Open source', short: 'Source', icon: Code2 },
  { to: '/help', label: 'Help', icon: CircleHelp },
  { to: '/about', label: 'About', icon: Info },
];

export default function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      // Why a blur rather than a solid bar: the page scrolls under the nav, and
      // a translucent surface lets that content show through instead of being
      // cut off at a hard white edge.
      className="md:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-6 border-t border-gray-200 bg-white/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            // Why: the visible label is the short one on a narrow screen, but
            // the tab still has to announce what it is.
            aria-label={item.short ? item.label : undefined}
            className={({ isActive }) =>
              // Why: the same brand tint the desktop pills use on hover, so a
              // touched tab reads as interactive on a phone too.
              // Why `dark:text-orange-300`: --color-brand-text is #a82d15,
              // which reaches only ~2.2:1 on the dark brand tint. orange-300
              // clears 5.6:1 — the same lift the guide categories use.
              `font-body flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] leading-tight transition-colors ${
                isActive
                  ? 'bg-brand/10 font-semibold text-brand-text dark:bg-brand/15 dark:text-orange-300'
                  : 'text-gray-600 hover:bg-brand/10 hover:text-brand-text dark:text-gray-300 dark:hover:bg-brand/15 dark:hover:text-orange-300'
              }`
            }
          >
            {/* The glyph is decorative — the label below it carries the name. */}
            <Icon aria-hidden className="h-5 w-5" />
            {/* The full label returns from the `sm` breakpoint up, where six
                tabs leave enough room for it. */}
            {item.short ? (
              <>
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </>
            ) : (
              <span>{item.label}</span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
