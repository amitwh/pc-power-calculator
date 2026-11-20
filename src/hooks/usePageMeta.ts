import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GUIDES } from '@/pages/Guides';
import { findComponent } from '@/lib/data/components';
import { listTariffPages } from '@/lib/data/tariffPages';

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
    const partMatch = pathname.match(/^\/parts\/([^/]+)$/);
    let partId: string | undefined;
    try {
      partId = partMatch ? decodeURIComponent(partMatch[1]) : undefined;
    } catch {
      partId = undefined;
    }
    const part = partId ? findComponent(partId) : undefined;
    const tariff = listTariffPages().find((ref) => ref.path === pathname);
    const title =
      guide?.title ??
      (part ? `${part.brand} ${part.model} power consumption & yearly cost` : undefined) ??
      (tariff ? `Electricity cost of running a PC in ${tariff.label}` : undefined) ??
      TITLES.find(([re]) => re.test(pathname))?.[1] ??
      'PC Power Calculator';
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
