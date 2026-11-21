import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import AppRoutes from '@/routes';
import { GUIDES } from '@/pages/Guides';
import { initCatalog } from '@/lib/data/components';
import { indexableParts } from '@/lib/data/partPages';
import { listTariffPages } from '@/lib/data/tariffPages';
import { resolveLocationTariff } from '@/lib/data/tariffs';
import { findCurrency } from '@/lib/data/currencies';
import { describeTariffRate } from '@/lib/calc/format';

export const SITE = 'https://pcpower.concreteinfo.co.in';

export type ChangeFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  ogType?: 'website' | 'article';
  priority: number;
  changefreq: ChangeFreq;
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

const ROOT_DESCRIPTION =
  "Estimate your PC's power draw, yearly electricity use and running cost — 2,200+ CPUs, GPUs and parts, local tariffs in any currency, shareable comparison and a PDF report.";

const guideRoutes: RouteMeta[] = GUIDES.map((guide) => {
  const path = `/guides/${guide.slug}`;
  const dateModified = isoMonth(guide.updated);
  return {
    path,
    title: guide.title,
    description: guide.description,
    ogType: 'article',
    priority: 0.7,
    changefreq: 'monthly',
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
 * The single source of truth for prerendered routes, page metadata and the
 * generated sitemap. Titles mirror `src/hooks/usePageMeta.ts` so a prerendered
 * page and a client-side navigation end on the same document title.
 */
export const ROUTES: RouteMeta[] = [
  {
    path: '/',
    title: "PC Power Calculator — estimate your PC's electricity use & cost",
    description: ROOT_DESCRIPTION,
    ogType: 'website',
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
    title: 'Compare systems · PC Power Calculator',
    description:
      'Compare PC builds side by side: yearly kWh, running cost in your currency, PSU sizing and a verdict on which system is cheaper to run.',
    ogType: 'website',
    priority: 0.8,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Compare', path: '/compare' }])],
  },
  {
    path: '/suggestions',
    title: 'PSU & UPS suggestions · PC Power Calculator',
    description:
      'Lower-power alternative parts that keep at least 90% of the relevant performance, ranked by the running cost they save at your tariff.',
    ogType: 'website',
    priority: 0.7,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Suggestions', path: '/suggestions' }])],
  },
  {
    path: '/suggest',
    title: 'Suggest a part or correction · PC Power Calculator',
    description:
      'Send corrections, missing components, new countries or tariff data to the public issue tracker so the calculator catalog stays accurate.',
    ogType: 'website',
    priority: 0.5,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Suggest a part', path: '/suggest' }])],
  },
  {
    path: '/data',
    title: 'Data freshness · PC Power Calculator',
    description:
      'Which component specs, electricity tariffs and exchange-rate snapshots the calculator uses, and when each dataset last changed.',
    ogType: 'website',
    priority: 0.4,
    changefreq: 'weekly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Data freshness', path: '/data' }])],
  },
  {
    path: '/about',
    title: 'About & methodology · PC Power Calculator',
    description:
      'How the calculator models component power, PSU efficiency and slab tariffs — sources, assumptions and the limits of every estimate.',
    ogType: 'website',
    priority: 0.5,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'About & methodology', path: '/about' }])],
  },
  {
    path: '/privacy',
    title: 'Privacy policy · PC Power Calculator',
    description:
      'What the calculator stores (only in your browser), when analytics and ads load, and how to opt out.',
    ogType: 'website',
    priority: 0.3,
    changefreq: 'yearly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Privacy policy', path: '/privacy' }])],
  },
  {
    path: '/guides',
    title: 'Guides & explainers · PC Power Calculator',
    description:
      'Short, practical guides to PC power draw, PSU sizing and Indian electricity billing, written to match the calculator’s model.',
    ogType: 'website',
    priority: 0.8,
    changefreq: 'monthly',
    jsonLd: [breadcrumbList([HOME_CRUMB, { name: 'Guides', path: '/guides' }])],
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
    const categoryLabel = part.category === 'gpu' ? 'graphics card' : 'processor';
    return {
      path,
      title: `${name} power consumption & yearly cost`,
      description: `Rated ${part.tdp_w} W ${categoryLabel}: modelled idle and full-load draw, yearly kWh and running cost on an Indian tariff, plus lower-power alternatives.`,
      ogType: 'website',
      priority: 0.6,
      changefreq: 'monthly',
      jsonLd: [breadcrumbList([HOME_CRUMB, { name, path }])],
    };
  });

  const tariffRoutes: RouteMeta[] = listTariffPages().map((ref) => {
    const { rate } = resolveLocationTariff(ref.iso2, ref.subdivisionCode);
    const currency = findCurrency(rate.currency) ?? findCurrency('USD')!;
    return {
      path: ref.path,
      title: `Electricity cost of running a PC in ${ref.label}`,
      description: `Electricity rates in ${ref.label}: ${describeTariffRate(rate, currency)}. What a 150 W, 350 W and 600 W PC costs per month at 4 h/day, with taxes.`,
      ogType: 'website',
      priority: 0.7,
      changefreq: 'monthly',
      jsonLd: [breadcrumbList([HOME_CRUMB, { name: ref.label, path: ref.path }])],
    };
  });

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
