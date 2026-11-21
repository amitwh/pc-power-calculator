import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GUIDES } from '@/pages/Guides';
import { findComponent } from '@/lib/data/components';
import { listTariffPages } from '@/lib/data/tariffPages';

const SITE = 'https://pcpower.concreteinfo.co.in';

const NOT_FOUND_TITLE = 'Page not found · PC Power Calculator';

/** Routes whose title never depends on catalog or tariff data. */
const STATIC_TITLES: Record<string, string> = {
  '/': "PC Power Calculator — estimate your PC's electricity use & cost",
  '/compare': 'Compare systems · PC Power Calculator',
  '/suggestions': 'PSU & UPS suggestions · PC Power Calculator',
  '/suggest': 'Suggest a part or correction · PC Power Calculator',
  '/data': 'Data freshness · PC Power Calculator',
  '/about': 'About & methodology · PC Power Calculator',
  '/privacy': 'Privacy policy · PC Power Calculator',
};

interface ResolvedRoute {
  title: string;
  notFound: boolean;
}

/**
 * Decide the title and whether the route actually exists. Both come from the
 * same resolution so a path that renders nothing can never keep an indexable
 * title. One trailing slash is ignored, so `/parts/x/` resolves like
 * `/parts/x`.
 */
function resolveRoute(rawPathname: string): ResolvedRoute {
  const pathname =
    rawPathname.length > 1 && rawPathname.endsWith('/') ? rawPathname.slice(0, -1) : rawPathname;

  if (pathname === '/guides') {
    return { title: 'Guides & explainers · PC Power Calculator', notFound: false };
  }

  const guideMatch = pathname.match(/^\/guides\/([^/]+)$/);
  if (guideMatch) {
    const guide = GUIDES.find((g) => g.slug === guideMatch[1]);
    return guide
      ? { title: guide.title, notFound: false }
      : { title: NOT_FOUND_TITLE, notFound: true };
  }

  const partMatch = pathname.match(/^\/parts\/([^/]+)$/);
  if (partMatch) {
    let partId: string | undefined;
    try {
      partId = decodeURIComponent(partMatch[1]);
    } catch {
      partId = undefined;
    }
    const part = partId ? findComponent(partId) : undefined;
    return part
      ? { title: `${part.brand} ${part.model} power consumption & yearly cost`, notFound: false }
      : { title: NOT_FOUND_TITLE, notFound: true };
  }

  if (/^\/cost\/[^/]+(?:\/[^/]+)?$/.test(pathname)) {
    // Tariff page paths are lowercase, but Cost.tsx uppercases its params, so a
    // hand-typed `/cost/IN` must still resolve.
    const tariff = listTariffPages().find((ref) => ref.path === pathname.toLowerCase());
    return tariff
      ? { title: `Electricity cost of running a PC in ${tariff.label}`, notFound: false }
      : { title: NOT_FOUND_TITLE, notFound: true };
  }

  const staticTitle = STATIC_TITLES[pathname];
  if (staticTitle) return { title: staticTitle, notFound: false };

  return { title: NOT_FOUND_TITLE, notFound: true };
}

/**
 * Per-route document title + canonical link. index.html ships a root
 * canonical + description; this keeps both correct once JS is running so
 * crawlers that render (Google) index each route separately.
 *
 * Unknown paths are marked `noindex, follow` and lose their canonical: nginx
 * serves `index.html` with HTTP 200 for them, so without this an arbitrary
 * URL would keep the home page's title and canonical and be indexed as a
 * duplicate of it.
 */
export function usePageMeta(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, notFound } = resolveRoute(pathname);
    document.title = title;

    if (notFound) {
      document.querySelector('link[rel="canonical"]')?.remove();

      let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex, follow';
      return;
    }

    document.querySelector('meta[name="robots"]')?.remove();

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${SITE}${pathname === '/' ? '/' : pathname}`;
  }, [pathname]);
}
