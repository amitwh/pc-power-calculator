import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import AppRoutes from '@/routes';
import { GUIDES } from '@/content/guides';
import { initCatalog } from '@/lib/data/components';
import { indexableParts } from '@/lib/data/partPages';
import { listTariffPages } from '@/lib/data/tariffPages';
import {
  tariffProvenance,
  tariffsLastUpdated,
} from '@/lib/data/tariffs';
import { GUIDES_DESCRIPTION, ROOT_DESCRIPTION, SITE, pageMetaFor } from '@/lib/seo/routeMeta';

// The origin lives with the metadata resolver now — one constant, so the
// sitemap, the canonical links and the meta tags cannot drift apart.
export { SITE };

export type ChangeFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  /** Keywords for the page's `meta[name="keywords"]` tag. */
  keywords: string[];
  ogType?: 'website' | 'article';
  priority: number;
  changefreq: ChangeFreq;
  /**
   * `YYYY-MM-DD` date the page's content last changed. The sitemap falls back
   * to the build date when a route has no better answer.
   */
  lastmod?: string;
  /** One `<script type="application/ld+json">` block is emitted per entry. */
  jsonLd?: object[];
}

interface Crumb {
  name: string;
  path: string;
}

const HOME_CRUMB: Crumb = { name: 'Home', path: '/' };

function breadcrumbList(trail: Crumb[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${SITE}${crumb.path}`,
    })),
  };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "November 2026" -> "2026-11-01", for schema.org dateModified. */
function isoMonth(updated: string): string | undefined {
  const match = updated.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return undefined;
  const monthIndex = MONTHS.indexOf(match[1]);
  if (monthIndex < 0) return undefined;
  return `${match[2]}-${String(monthIndex + 1).padStart(2, '0')}-01`;
}

/** `"2026-10-29"` or an ISO timestamp -> `"2026-10-29"`; otherwise undefined. */
function isoDate(value?: string): string | undefined {
  return value?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
}

/**
 * The resolver's answer for a route, folded into a manifest entry.
 *
 * Why: the manifest used to spell out every title and description by hand,
 * which meant a title could exist twice — once here, once in the metadata
 * resolver — and the two would quietly drift apart. The resolver owns the
 * copy; the manifest owns the sitemap fields (priority, changefreq, lastmod)
 * and the JSON-LD.
 */
function metaFor(path: string): Pick<RouteMeta, 'title' | 'description' | 'keywords' | 'ogType'> {
  const meta = pageMetaFor(path);
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    ogType: meta.ogType,
  };
}

const guideRoutes: RouteMeta[] = GUIDES.map((guide) => {
  const path = `/guides/${guide.slug}`;
  const dateModified = isoMonth(guide.updated);
  return {
    path,
    ...metaFor(path),
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: dateModified,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        url: `${SITE}${path}`,
        ...(dateModified ? { dateModified } : {}),
      },
      breadcrumbList([HOME_CRUMB, { name: 'Guides', path: '/guides' }, { name: guide.title, path }]),
    ],
  };
});

/**
 * The prerender manifest: the static routes plus one entry per guide.
 *
 * The titles and descriptions come from the metadata resolver (the same one
 * the client-side navigation uses), so a prerendered page and a client-side
 * navigation always end on the same document title and description. This
 * module owns the sitemap fields — priority, changefreq, lastmod — and the
 * JSON-LD, which the resolver deliberately does not know about.
 */
export const ROUTES: RouteMeta[] = [
  {
    path: '/',
    ...metaFor('/'),
    priority: 1,
    changefreq: 'weekly',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'PC Power Calculator',
        url: `${SITE}/`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'PC Power Calculator',
        url: `${SITE}/`,
        applicationCategory: 'UtilitiesApplication',
        applicationSubCategory: 'Electricity cost calculator',
        operatingSystem: 'Any',
        description: ROOT_DESCRIPTION,
        isAccessibleForFree: true,
        browserRequirements: 'Requires JavaScript. Works offline once installed.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        featureList: [
          'Yearly, monthly and daily running cost for a PC build',
          'Load-dependent PSU efficiency (80 PLUS curves)',
          'Regional electricity tariffs with slab tiers and taxes',
          'PSU sizing recommendation with headroom',
          'Shareable build links and PDF, HTML and CSV exports',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ConcreteInfo',
        url: 'https://www.concreteinfo.in',
        sameAs: ['https://www.concreteinfo.in'],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          url: `${SITE}/suggestions`,
        },
      },
    ],
  },
  {
    path: '/compare',
    ...metaFor('/compare'),
    priority: 0.8,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Compare', path: '/compare' }])],
  },
  {
    path: '/suggestions',
    ...metaFor('/suggestions'),
    priority: 0.7,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Suggestions', path: '/suggestions' }])],
  },
  {
    path: '/suggest',
    ...metaFor('/suggest'),
    priority: 0.5,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Suggest a part', path: '/suggest' }])],
  },
  {
    path: '/feedback',
    ...metaFor('/feedback'),
    priority: 0.4,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Feedback', path: '/feedback' }])],
  },
  {
    path: '/data',
    ...metaFor('/data'),
    priority: 0.4,
    changefreq: 'weekly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Data freshness', path: '/data' }])],
  },
  {
    path: '/about',
    ...metaFor('/about'),
    priority: 0.5,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'About & methodology', path: '/about' }])],
  },
  {
    path: '/privacy',
    ...metaFor('/privacy'),
    priority: 0.3,
    changefreq: 'yearly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Privacy policy', path: '/privacy' }])],
  },
  {
    path: '/guides',
    ...metaFor('/guides'),
    priority: 0.8,
    changefreq: 'monthly',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Guides & explainers',
        // Why the resolver's wording: the JSON-LD description and the visible
        // lede describe the same collection, so they read the same string.
        description: GUIDES_DESCRIPTION,
        url: `${SITE}/guides`,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: GUIDES.map((guide, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: guide.title,
            url: `${SITE}/guides/${guide.slug}`,
          })),
        },
      },
      breadcrumbList([HOME_CRUMB, { name: 'Guides', path: '/guides' }]),
    ],
  },
  ...guideRoutes,
];

/**
 * Full prerender manifest: the static routes plus one `/parts/:id` page per
 * part in the current tranche. Awaits the catalog because the part list is
 * loaded from the code-split JSON chunk.
 */
export async function getRoutes(): Promise<RouteMeta[]> {
  await initCatalog();

  const partRoutes: RouteMeta[] = indexableParts().map((part) => {
    const path = `/parts/${encodeURIComponent(part.id)}`;
    const name = `${part.brand} ${part.model}`;
    return {
      path,
      ...metaFor(path),
      priority: 0.6,
      changefreq: 'monthly',
      lastmod: isoDate(part.addedAt),
      jsonLd: [breadcrumbList([HOME_CRUMB, { name, path }])],
    };
  });

  const tariffRoutes: RouteMeta[] = listTariffPages().map((ref) => ({
    path: ref.path,
    ...metaFor(ref.path),
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: isoDate(tariffProvenance(ref.iso2).updated) ?? isoDate(tariffsLastUpdated()),
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: ref.label, path: ref.path }])],
  }));

  return [...ROUTES, ...partRoutes, ...tariffRoutes];
}

/**
 * Build-time entry: awaits the catalog (every sync component accessor depends
 * on it), then renders the route tree at `url` to static HTML. Kept free of
 * browser-only imports so it can run in Node.
 */
export async function render(url: string): Promise<{ html: string }> {
  await initCatalog();
  const html = renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>,
  );
  return { html };
}
