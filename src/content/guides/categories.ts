import type { LucideIcon } from 'lucide-react';
import { Cpu, Receipt, Zap } from 'lucide-react';
import type { GuideCategory } from './types';

export interface GuideCategoryStyle {
  label: string;
  blurb: string;
  /** Tailwind classes for the icon tile behind the guide icon. */
  tile: string;
  /** Tailwind classes for the icon itself, on that tile. */
  icon: string;
  /** Tailwind classes for the section heading and its rule. */
  heading: string;
  /**
   * The accent for coloured *text* — a heading, a badge label.
   *
   * Why it is not `icon`: the brand's own bright orange (#ff6b47) scores
   * 3.3:1 on the app's gray-900 dark card. That is enough for a glyph, which
   * only needs 3:1, but a label needs 4.5:1 — so the dark tone is lifted to
   * orange-300, the same warm family at 5.6:1. This is the lift
   * `lib/categoryColors.ts` gives every badge hue for the dark surface.
   */
  accent: string;
  /**
   * The category's own mark — the tile in the hero chips and the section
   * headings. Individual guides carry their own icon (a gauge for a PSU
   * guide, a GPU for a graphics guide); a category needs one icon that stands
   * for the whole shelf.
   */
  symbol: LucideIcon;
  /** Tailwind classes for the category chip in the hero. */
  chip: string;
  /**
   * Tailwind classes for the card's hover border. Light and dark are spelled
   * out separately so the hover colour wins the cascade in both schemes
   * instead of tying with the `dark:` border utility.
   */
  cardHover: string;
}

/**
 * One identity per guide category — the label, the blurb and the three
 * colours that tint the category everywhere a guide is listed.
 *
 * Why: the hub, the nav dropdown and the guide cards all tint a guide by its
 * category, and the class strings have to stay literal or Tailwind's scanner
 * never sees them. One map keeps the tints in step and lets the label/blurb
 * live with the colours instead of in a second list that can drift.
 */
export const GUIDE_CATEGORY_STYLES: Record<GuideCategory, GuideCategoryStyle> = {
  power: {
    label: 'Power & electricity',
    blurb:
      'How much a build draws, what the power supply does with it, and what it costs to run.',
    tile: 'bg-brand/10',
    icon: 'text-brand-text dark:text-brand-light',
    heading: 'text-brand-text dark:text-brand-light',
    accent: 'text-brand-text dark:text-orange-300',
    symbol: Zap,
    chip: 'bg-brand/10 dark:bg-brand/15',
    cardHover: 'hover:border-brand/40 dark:hover:border-brand/50',
  },
  hardware: {
    label: 'Hardware deep-dives',
    blurb:
      'What each part of a PC is, what it does, and why it draws the watts it draws.',
    tile: 'bg-sky-100 dark:bg-sky-500/20',
    icon: 'text-sky-700 dark:text-sky-300',
    heading: 'text-sky-700 dark:text-sky-300',
    accent: 'text-sky-700 dark:text-sky-300',
    symbol: Cpu,
    chip: 'bg-sky-100 dark:bg-sky-500/20',
    cardHover: 'hover:border-sky-400/60 dark:hover:border-sky-400/50',
  },
  billing: {
    label: 'Electricity billing',
    blurb: 'Slabs, duty and fixed charges — how an Indian bill is actually built.',
    tile: 'bg-emerald-100 dark:bg-emerald-500/20',
    icon: 'text-emerald-800 dark:text-emerald-300',
    heading: 'text-emerald-800 dark:text-emerald-300',
    accent: 'text-emerald-800 dark:text-emerald-300',
    symbol: Receipt,
    chip: 'bg-emerald-100 dark:bg-emerald-500/20',
    cardHover: 'hover:border-emerald-500/60 dark:hover:border-emerald-400/50',
  },
};

/**
 * The sections the hub groups guides into.
 *
 * Why: the categories are content, not layout — the hub, the nav dropdown and
 * the category filter all read the same list, so the labels and blurbs are
 * written once. It is derived from the style map above so the two can never
 * disagree about a label.
 */
export const GUIDE_CATEGORIES: { id: GuideCategory; label: string; blurb: string }[] =
  (Object.entries(GUIDE_CATEGORY_STYLES) as [GuideCategory, GuideCategoryStyle][]).map(
    ([id, style]) => ({ id, label: style.label, blurb: style.blurb }),
  );
