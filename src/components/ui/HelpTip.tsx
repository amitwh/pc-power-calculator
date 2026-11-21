import { useId } from 'react';
import { Info } from 'lucide-react';

export interface HelpTipProps {
  /** The sentence shown in the bubble. Keep it to one short line. */
  text: string;
  align?: 'left' | 'center' | 'right';
  /** Accessible name for the focusable mark. Defaults to "Help". */
  label?: string;
}

const ALIGN_CLASS: Record<NonNullable<HelpTipProps['align']>, string> = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
};

/**
 * A small focusable info mark with a hover/focus bubble. Native `title` is
 * enough for inputs and icon buttons; this is for controls whose meaning is
 * not obvious from the label.
 */
export function HelpTip({ text, align = 'center', label = 'Help' }: HelpTipProps) {
  const id = useId();

  return (
    <span className="group relative inline-flex shrink-0 items-center">
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-700 focus:text-gray-700 focus:outline-none dark:text-gray-500 dark:hover:text-gray-300 dark:focus:text-gray-300"
      >
        <Info aria-hidden className="h-3.5 w-3.5" />
      </button>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute top-full z-50 mt-1.5 hidden w-56 rounded-8 bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-card-raised group-hover:block group-focus-within:block dark:bg-gray-100 dark:text-gray-900 ${ALIGN_CLASS[align]}`}
      >
        {text}
      </span>
    </span>
  );
}
