import type { ReactNode } from 'react';

/** Sections the hub groups guides into. */
export type GuideCategory = 'power' | 'hardware' | 'billing';

export interface Guide {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  updated: string;
  category: GuideCategory;
  /** Free keywords — drives the hub filter and the page's `keywords` meta tag. */
  tags: string[];
  body: ReactNode;
}
