import { useEffect, useId, useRef, useState } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  meta?: { brand?: string; year?: number; tdp_w?: number | null };
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (v: string | null) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Show brand filter chips above the list. Defaults to true when ≥2 brands. */
  brandFilter?: boolean;
  emptyMessage?: string;
}

/**
 * Searchable combobox — replaces native <select> for long option lists (CPUs / GPUs).
 * Mobile-first: ≥44px trigger, scrollable list with brand chips + free-text filter.
 * Closes on outside click, Escape, or selection.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  ariaLabel,
  brandFilter = true,
  emptyMessage = 'No matches',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  const brands = Array.from(
    new Set(options.map((o) => o.meta?.brand).filter(Boolean) as string[]),
  ).sort();

  const filtered = options.filter((o) => {
    if (activeBrand && o.meta?.brand !== activeBrand) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!o.label.toLowerCase().includes(q) && !(o.meta?.brand ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Autofocus search on open, clear query on close
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    setQuery('');
    setActiveBrand(null);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[44px] px-3 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 font-body text-left flex items-center justify-between gap-2"
      >
        <span className={selected ? 'truncate' : 'truncate text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <span aria-hidden className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1 w-full max-h-[60vh] sm:max-h-[400px] overflow-hidden flex flex-col bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-8 shadow-lg"
        >
          {/* Search + brand chips (sticky header) */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search options"
              className="w-full min-h-[36px] px-3 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-body"
            />
            {brandFilter && brands.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-2" role="group" aria-label="Filter by brand">
                <button
                  type="button"
                  onClick={() => setActiveBrand(null)}
                  aria-pressed={activeBrand === null}
                  className={`text-xs px-2 py-1 rounded-full border min-h-[28px] ${
                    activeBrand === null
                      ? 'bg-brand-dark text-white border-brand-dark'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  All ({options.length})
                </button>
                {brands.map((b) => {
                  const count = options.filter((o) => o.meta?.brand === b).length;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setActiveBrand((cur) => (cur === b ? null : b))}
                      aria-pressed={activeBrand === b}
                      className={`text-xs px-2 py-1 rounded-full border min-h-[28px] ${
                        activeBrand === b
                          ? 'bg-brand-dark text-white border-brand-dark'
                          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {b} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scrollable option list */}
          <ul className="overflow-y-auto py-1 flex-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-gray-500">{emptyMessage}</li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={o.value === value}
                  tabIndex={0}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onChange(o.value);
                      setOpen(false);
                    }
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-brand/10 focus:bg-brand/10 focus:outline-none ${
                    o.value === value ? 'bg-brand/10 font-semibold' : ''
                  }`}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}