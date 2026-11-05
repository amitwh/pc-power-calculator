import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GUIDES } from '@/pages/Guides';

const SITE = 'https://pcpower.concreteinfo.co.in';

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "PC Power Calculator — estimate your PC's electricity use & cost"],
  [/^\/compare/, 'Compare systems · PC Power Calculator'],
  [/^\/suggestions/, 'PSU & UPS suggestions · PC Power Calculator'],
  [/^\/data/, 'Data freshness · PC Power Calculator'],
  [/^\/guides/, 'Guides & explainers · PC Power Calculator'],
  [/^\/about/, 'About & methodology · PC Power Calculator'],
  [/^\/privacy/, 'Privacy policy · PC Power Calculator'],
];

/**
 * Per-route document title + canonical link. index.html ships a root
 * canonical + description; this keeps both correct once JS is running so
 * crawlers that render (Google) index each route separately.
 */
export function usePageMeta(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const guide = GUIDES.find((g) => pathname === `/guides/${g.slug}`);
    const title =
      guide?.title ?? TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'PC Power Calculator';
    document.title = title;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${SITE}${pathname === '/' ? '/' : pathname}`;
  }, [pathname]);
}
