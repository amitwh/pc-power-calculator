// Build-time prerender: takes the client build's index.html as the template,
// renders every route from the SSR bundle, and writes one static
// dist/<path>/index.html per route with per-page meta and JSON-LD. Also emits
// dist/sitemap.xml from the same route manifest.
//
// Run after both `vite build` and `vite build --ssr src/entry-server.tsx`.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST, 'index.html');
const SSR_ENTRY_PATH = path.join(ROOT, 'dist-ssr', 'entry-server.js');
const SITE = 'https://pcpower.concreteinfo.co.in';
const OG_IMAGE = `${SITE}/og.png`;
const TWITTER_CARD = 'summary_large_image';

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const canonicalUrl = (routePath) => `${SITE}${routePath === '/' ? '/' : routePath}`;

/** Replace the first matching tag, or insert the replacement before </head>. */
function upsertTag(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace('</head>', `    ${replacement}\n  </head>`);
}

function injectHead(html, route) {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const keywords = escapeHtml((route.keywords ?? []).join(', '));
  const url = escapeHtml(canonicalUrl(route.path));
  const ogType = route.ogType ?? 'website';

  let out = html;
  out = upsertTag(out, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bname="description"[^>]*>/i,
    `<meta name="description" content="${description}" />`,
  );
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bname="keywords"[^>]*>/i,
    `<meta name="keywords" content="${keywords}" />`,
  );
  out = upsertTag(
    out,
    /<link\s+[^>]*\brel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${url}" />`,
  );
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bproperty="og:type"[^>]*>/i,
    `<meta property="og:type" content="${ogType}" />`,
  );
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bproperty="og:title"[^>]*>/i,
    `<meta property="og:title" content="${title}" />`,
  );
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bproperty="og:description"[^>]*>/i,
    `<meta property="og:description" content="${description}" />`,
  );
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bproperty="og:url"[^>]*>/i,
    `<meta property="og:url" content="${url}" />`,
  );
  // The Twitter card mirrors the Open Graph one — the template ships the
  // home page's defaults, so every page has to overwrite them.
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bname="twitter:card"[^>]*>/i,
    `<meta name="twitter:card" content="${TWITTER_CARD}" />`,
  );
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bname="twitter:title"[^>]*>/i,
    `<meta name="twitter:title" content="${title}" />`,
  );
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bname="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${description}" />`,
  );
  out = upsertTag(
    out,
    /<meta\s+[^>]*\bname="twitter:image"[^>]*>/i,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
  );

  const jsonLd = (route.jsonLd ?? [])
    .map(
      (entry) =>
        `<script type="application/ld+json">${JSON.stringify(entry).replace(/</g, '\\u003c')}</script>`,
    )
    .join('\n    ');
  if (jsonLd) out = out.replace('</head>', `    ${jsonLd}\n  </head>`);

  return out;
}

/**
 * Replace the boot-splash markup inside `#root` with the rendered HTML and add
 * the `data-prerendered` marker the client uses to choose hydrate vs create.
 */
function injectBody(html, renderedHtml) {
  const openTag = '<div id="root">';
  const rootStart = html.indexOf(openTag);
  if (rootStart === -1) throw new Error('Template is missing <div id="root">');

  // Walk nested <div> tags to find the one closing #root. The boot splash in
  // the template nests divs, so a naive first-</div> match would truncate it.
  let depth = 1;
  let cursor = rootStart + openTag.length;
  let rootEnd = -1;
  while (cursor < html.length) {
    const nextOpen = html.indexOf('<div', cursor);
    const nextClose = html.indexOf('</div>', cursor);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = nextOpen + '<div'.length;
    } else {
      depth -= 1;
      cursor = nextClose + '</div>'.length;
      if (depth === 0) {
        rootEnd = cursor;
        break;
      }
    }
  }
  if (rootEnd === -1) throw new Error('Template is missing the closing </div> for #root');

  const replacement = `<div id="root" data-prerendered="true">${renderedHtml}</div>`;
  return html.slice(0, rootStart) + replacement + html.slice(rootEnd);
}

function sitemap(routes, buildDate) {
  const urls = routes
    .map((route) => {
      // A route that knows when its content changed reports that date; purely
      // static pages fall back to the build date.
      const lastmod = route.lastmod ?? buildDate;
      return (
        `  <url><loc>${escapeHtml(canonicalUrl(route.path))}</loc><lastmod>${lastmod}</lastmod>` +
        `<changefreq>${route.changefreq}</changefreq><priority>${route.priority.toFixed(1)}</priority></url>`
      );
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function main() {
  const started = Date.now();

  let template;
  try {
    template = await readFile(TEMPLATE_PATH, 'utf8');
  } catch {
    throw new Error(`Missing client build template at ${TEMPLATE_PATH} — run "vite build" first`);
  }

  // Offline shell for the service worker's navigateFallback. It is the client
  // build's own template — empty #root, no data-prerendered marker — so the SW
  // hands an uncached navigation the app shell (client-rendered) rather than
  // the home page's prerendered markup, which would hydrate against the wrong
  // route. Workbox cannot glob it (this runs after the SW is generated), so it
  // is precached via `workbox.additionalManifestEntries` in vite.config.ts.
  // Replace the template's indexable robots tag rather than appending a second
  // one: two conflicting directives would leave the shell's status ambiguous.
  const offlineShell = upsertTag(
    template,
    /<meta\s+[^>]*\bname="robots"[^>]*>/i,
    '<meta name="robots" content="noindex" />',
  );
  await writeFile(path.join(DIST, 'offline.html'), offlineShell, 'utf8');
  console.log('✓ /offline.html            -> dist/offline.html');

  let ssr;
  try {
    ssr = await import(pathToFileURL(SSR_ENTRY_PATH).href);
  } catch (err) {
    throw new Error(
      `Could not load the SSR bundle at ${SSR_ENTRY_PATH} — run "vite build --ssr src/entry-server.tsx --outDir dist-ssr" first: ${err.message}`,
    );
  }

  const { getRoutes, render } = ssr;
  if (typeof getRoutes !== 'function' || typeof render !== 'function') {
    throw new Error('SSR bundle must export getRoutes() and render(url)');
  }
  const ROUTES = await getRoutes();

  // Render every route before touching dist, so a failure leaves no partial set.
  const pages = [];
  for (const route of ROUTES) {
    const { html } = await render(route.path);
    if (typeof html !== 'string' || html.length === 0) {
      throw new Error(`render("${route.path}") returned empty HTML`);
    }
    pages.push({ route, html });
  }

  for (const { route, html } of pages) {
    const page = injectBody(injectHead(template, route), html);
    const outPath =
      route.path === '/'
        ? path.join(DIST, 'index.html')
        : path.join(DIST, route.path.replace(/^\//, ''), 'index.html');
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, page, 'utf8');
    console.log(`✓ ${route.path.padEnd(24)} -> ${path.relative(ROOT, outPath)}`);
  }

  const buildDate = new Date().toISOString().slice(0, 10);
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap(ROUTES, buildDate), 'utf8');
  console.log(`✓ /sitemap.xml             -> dist/sitemap.xml (${ROUTES.length} URLs)`);

  console.log(
    `Prerendered ${pages.length} routes + sitemap in ${Date.now() - started} ms`,
  );
}

main().catch((err) => {
  console.error(`Prerender failed: ${err?.message ?? err}`);
  process.exitCode = 1;
});
