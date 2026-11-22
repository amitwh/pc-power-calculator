import { GUIDES } from '@/content/guides';
import type { Guide } from '@/content/guides';
import { describeTariffRate } from '@/lib/calc/format';
import { findCurrency } from '@/lib/data/currencies';
import { findComponent } from '@/lib/data/components';
import { listTariffPages } from '@/lib/data/tariffPages';
import { resolveLocationTariff } from '@/lib/data/tariffs';
import type { Component } from '@/types/component';

/** The canonical origin every absolute URL in the metadata is built from. */
export const SITE = 'https://pcpower.concreteinfo.net';

/** The social card every page points at. */
export const OG_IMAGE = `${SITE}/og.png`;

/** Twitter's large-card layout — the OG image is 1200x630. */
export const TWITTER_CARD = 'summary_large_image';

export type OgType = 'website' | 'article';

export interface PageMeta {
  /** Full document title, exactly as it should appear in <title>. */
  title: string;
  /** Meta description — one or two sentences. */
  description: string;
  /** Keywords for the <meta name="keywords"> tag. */
  keywords: string[];
  ogType: OgType;
  /** false when the path does not exist -> the page must be noindex. */
  found: boolean;
}

/** The home page's description — also the WebApplication JSON-LD copy. */
export const ROOT_DESCRIPTION =
  "Estimate your PC's power draw, yearly electricity use and running cost — 2,200+ CPUs, GPUs and parts, local tariffs in any currency, shareable comparison and a PDF report.";

/**
 * The guides hub's one-liner. It is also the visible `lede` on the hub page —
 * the two must agree, so the wording lives here and the page quotes it.
 */
export const GUIDES_DESCRIPTION =
  "Short, practical reads on PC power draw, PSU sizing, electricity billing and the hardware behind them — written to match the calculator's model.";

interface StaticMeta {
  title: string;
  description: string;
  keywords: string[];
}

/**
 * The routes whose metadata never depends on the hardware catalog or a
 * tariff schedule, so they can be answered without any I/O.
 *
 * Why one map: the prerender manifest and the client-side navigation used to
 * each carry their own copy of these strings. One map means a prerendered page
 * and a client-side navigation can never disagree.
 */
const STATIC_ROUTES: Record<string, StaticMeta> = {
  '/': {
    title: "PC Power Calculator — estimate your PC's electricity use & cost",
    description: ROOT_DESCRIPTION,
    keywords: [
      'pc power calculator',
      'pc electricity cost',
      'power consumption calculator',
      'psu calculator',
      'kwh calculator',
      'pc running cost',
    ],
  },
  '/compare': {
    title: 'Compare systems · PC Power Calculator',
    description:
      'Compare PC builds side by side: yearly kWh, running cost in your currency, PSU sizing and a verdict on which system is cheaper to run.',
    keywords: [
      'compare pc power consumption',
      'compare pc electricity cost',
      'pc build comparison',
      'yearly kwh comparison',
      'psu sizing comparison',
      'pc running cost comparison',
    ],
  },
  '/suggestions': {
    title: 'PSU & UPS suggestions · PC Power Calculator',
    description:
      'Lower-power alternative parts that keep at least 90% of the relevant performance, ranked by the running cost they save at your tariff.',
    keywords: [
      'psu ups suggestions',
      'lower power pc parts',
      'energy efficient pc parts',
      'pc power saving tips',
      'psu recommendation',
      'pc electricity savings',
    ],
  },
  '/suggest': {
    title: 'Suggest a part or correction · PC Power Calculator',
    description:
      'Send corrections, missing components, new countries or tariff data to the team so the calculator catalog stays accurate.',
    keywords: [
      'suggest a pc part',
      'pc calculator correction',
      'missing component',
      'electricity tariff data',
      'contribute pc data',
      'pc power database',
    ],
  },
  '/feedback': {
    title: 'Feedback · PC Power Calculator',
    description:
      'Report a bug, suggest a feature, or tell us about a content problem in the PC power and electricity cost calculator.',
    keywords: [
      'pc power calculator feedback',
      'report a bug',
      'feature request',
      'pc calculator accuracy',
      'pc power content issue',
    ],
  },
  '/data': {
    title: 'Data freshness · PC Power Calculator',
    description:
      'Which component specs, electricity tariffs and exchange-rate snapshots the calculator uses, and when each dataset last changed.',
    keywords: [
      'pc power data sources',
      'component spec database',
      'electricity tariff data freshness',
      'pc component tdp data',
      'exchange rate snapshot',
    ],
  },
  '/about': {
    title: 'About & methodology · PC Power Calculator',
    description:
      'How the calculator models component power, PSU efficiency and slab tariffs — sources, assumptions and the limits of every estimate, plus the free tools ConcreteInfo publishes.',
    keywords: [
      'pc power calculator methodology',
      'how pc power is calculated',
      'psu efficiency model',
      'slab tariff model',
      'pc power estimation limits',
      'concreteinfo free tools',
      'open source pc tools',
    ],
  },
  '/privacy': {
    title: 'Privacy policy · PC Power Calculator',
    description:
      'What the calculator stores (only in your browser), when analytics and ads load, and how to opt out.',
    keywords: [
      'pc power calculator privacy',
      'local browser storage',
      'analytics opt out',
      'ads opt out',
      'no data uploaded',
    ],
  },
  '/guides': {
    title: 'Guides & explainers · PC Power Calculator',
    description: GUIDES_DESCRIPTION,
    keywords: [
      'pc power guides',
      'psu guide',
      'pc hardware explained',
      'cpu guide',
      'gpu guide',
      'electricity bill guide',
    ],
  },
  '/help': {
    title: 'Help & user guide · PC Power Calculator',
    description:
      'How to use the PC power calculator: add your parts, set how you use the machine, pick your tariff, read the yearly cost and check the estimate before you trust it.',
    keywords: [
      'pc power calculator help',
      'how to use pc power calculator',
      'pc power calculator guide',
      'pc electricity cost help',
      'pc power calculator user guide',
    ],
  },
  '/open-source': {
    title: 'Open source · PC Power Calculator',
    description:
      'A directory of the open-source projects ConcreteInfo publishes — PC Power Calculator, GitHub Desktop for Linux, CurveStudio and Markdown Converter: what each one is, the licence it carries and where to get the source.',
    keywords: [
      'open source projects',
      'free open source pc tools',
      'github desktop for linux',
      'curvestudio',
      'markdown converter',
      'concreteinfo open source',
    ],
  },
};

/**
 * What an unknown path gets. It is noindexed, so the copy only has to say
 * "this is not here" — it never has to sell anything.
 */
function notFoundMeta(): PageMeta {
  return {
    title: 'Page not found · PC Power Calculator',
    description: 'That page does not exist. Start from the calculator or browse the guides.',
    keywords: ['pc power calculator'],
    ogType: 'website',
    found: false,
  };
}

/**
 * One trailing slash is ignored, so `/parts/x/` resolves like `/parts/x`.
 * The root keeps its slash — it is a path, not an empty string.
 */
function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

/** The guide's own tags plus the two site-wide terms, without duplicates. */
function guideKeywords(guide: Guide): string[] {
  const seen = new Set(guide.tags.map((tag) => tag.toLowerCase()));
  const extras = ['pc power', 'pc power calculator'].filter((term) => !seen.has(term.toLowerCase()));
  return [...guide.tags, ...extras];
}

/** The human word for a part's category — "graphics card" reads better than "gpu". */
function categoryLabel(part: Component): string {
  return part.category === 'gpu' ? 'graphics card' : 'processor';
}

/**
 * The metadata for a `/parts/:id` page, or undefined when the id is unknown.
 * A part id that fails `decodeURIComponent` is simply not found.
 */
function partMetaFor(path: string): PageMeta | undefined {
  const match = path.match(/^\/parts\/([^/]+)$/);
  if (!match) return undefined;

  let partId: string | undefined;
  try {
    partId = decodeURIComponent(match[1]);
  } catch {
    partId = undefined;
  }
  const part = partId ? findComponent(partId) : undefined;
  if (!part) return undefined;

  const name = `${part.brand} ${part.model}`;
  return {
    title: `${name} power consumption & yearly cost`,
    // Why the part leads: two parts of the same category and the same rated
    // wattage would otherwise share a description word for word, and the
    // catalogue has plenty of those pairs. Naming the part makes every one of
    // these pages distinct in the search results.
    description: `${name} — rated ${part.tdp_w} W ${categoryLabel(part)}: modelled idle and full-load draw, yearly kWh and running cost on an Indian tariff, plus lower-power alternatives.`,
    keywords: [
      part.brand,
      part.model,
      categoryLabel(part),
      'power consumption',
      'tdp',
      'electricity cost',
    ],
    ogType: 'website',
    found: true,
  };
}

/**
 * The metadata for a `/cost/:country` or `/cost/:country/:state` page, or
 * undefined when the location is unknown. Tariff page paths are lowercase, but
 * the page itself uppercases its params, so a hand-typed `/cost/IN` has to
 * resolve.
 */
function tariffMetaFor(path: string): PageMeta | undefined {
  if (!/^\/cost\/[^/]+(?:\/[^/]+)?$/.test(path)) return undefined;

  const ref = listTariffPages().find((candidate) => candidate.path === path.toLowerCase());
  if (!ref) return undefined;

  const { rate } = resolveLocationTariff(ref.iso2, ref.subdivisionCode);
  const currency = findCurrency(rate.currency) ?? findCurrency('USD')!;
  return {
    title: `Electricity cost of running a PC in ${ref.label}`,
    description: `Electricity rates in ${ref.label}: ${describeTariffRate(rate, currency)}. What a 150 W, 350 W and 600 W PC costs per month at 4 h/day, with taxes.`,
    keywords: [ref.label, 'electricity tariff', 'pc running cost', 'electricity bill'],
    ogType: 'website',
    found: true,
  };
}

/**
 * Resolve the metadata for a path.
 *
 * Why one resolver: the prerenderer and the client-side navigation used to
 * keep separate copies of the titles, and the client only refreshed half the
 * tags — so a reader who navigated from the home page to a guide kept the
 * home page's description and OG tags. Both sides call this now, so a
 * prerendered page and a client-side navigation always agree.
 *
 * Browser-free on purpose: the prerenderer runs it in Node.
 */
export function pageMetaFor(pathname: string): PageMeta {
  const path = stripTrailingSlash(pathname);

  if (path.startsWith('/guides/')) {
    const slug = path.slice('/guides/'.length);
    const guide = GUIDES.find((candidate) => candidate.slug === slug);
    if (guide) {
      return {
        title: guide.title,
        description: guide.description,
        keywords: guideKeywords(guide),
        ogType: 'article',
        found: true,
      };
    }
    return notFoundMeta();
  }

  const part = partMetaFor(path);
  if (part) return part;

  const tariff = tariffMetaFor(path);
  if (tariff) return tariff;

  const staticMeta = STATIC_ROUTES[path];
  if (staticMeta) {
    // A fresh keywords array: the table above is shared, and a caller that
    // sorts the list in place must not reorder the stored copy.
    return { ...staticMeta, keywords: [...staticMeta.keywords], ogType: 'website', found: true };
  }

  return notFoundMeta();
}
