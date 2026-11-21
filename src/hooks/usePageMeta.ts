import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { OG_IMAGE, SITE, TWITTER_CARD, pageMetaFor } from '@/lib/seo/routeMeta';

/**
 * Update a meta tag's content, creating the tag when it is missing.
 *
 * Why: the client-side navigation used to refresh only the title and the
 * canonical, so the description, the OG tags and the Twitter tags kept the
 * values of the page the reader came from. Every tag the resolver owns goes
 * through here, so the head always describes the page that is on screen.
 */
function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/** Point the canonical link at `href`, creating the link when it is missing. */
function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

/**
 * Per-route document metadata: title, description, keywords, canonical, the
 * Open Graph and Twitter cards. index.html ships the defaults; this keeps them
 * correct once JS is running so crawlers that render (Google) index each
 * route separately.
 *
 * The metadata itself comes from the shared resolver
 * (`@/lib/seo/routeMeta`), the same one the prerenderer uses — so a
 * prerendered page and a client-side navigation always agree.
 *
 * Unknown paths are marked `noindex, follow` and lose their canonical: nginx
 * serves `index.html` with HTTP 200 for them, so without this an arbitrary
 * URL would keep the home page's title and canonical and be indexed as a
 * duplicate of it.
 */
export function usePageMeta(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = pageMetaFor(pathname);
    document.title = meta.title;

    const url = `${SITE}${pathname === '/' ? '/' : pathname}`;

    upsertMeta('name', 'description', meta.description);
    upsertMeta('name', 'keywords', meta.keywords.join(', '));
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', meta.ogType);
    upsertMeta('name', 'twitter:card', TWITTER_CARD);
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', OG_IMAGE);

    if (!meta.found) {
      document.head.querySelector('link[rel="canonical"]')?.remove();

      let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex, follow';
      return;
    }

    document.head.querySelector('meta[name="robots"]')?.remove();
    upsertCanonical(url);
  }, [pathname]);
}
