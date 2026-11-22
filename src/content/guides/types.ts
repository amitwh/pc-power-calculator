import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Sections the hub groups guides into. */
export type GuideCategory = 'power' | 'hardware' | 'billing';

export interface Guide {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  updated: string;
  category: GuideCategory;
  /** The lucide icon shown on this guide's card and in the nav dropdown. */
  icon: LucideIcon;
  /** Free keywords — drives the hub filter and the page's `keywords` meta tag. */
  tags: string[];
  body: ReactNode;
}
