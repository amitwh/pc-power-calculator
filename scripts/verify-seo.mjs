// Build-time SEO audit of the built `dist/` directory.
//
// Why: the metadata is written by three different places (the template, the
// prerenderer and the client-side hook), so a tag can go missing or a page can
// keep a stale value without anything failing. This script checks the built
// output instead of the source: every page must carry the full set of tags,
// no two pages may share a title or a description, and the sitemap and
// robots.txt must agree with what was actually built.
//
// Run after `node scripts/prerender.mjs`. Exits non-zero on any failure so it
// can gate a build.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://pcpower.concreteinfo.co.in';

/** The shell the service worker falls back to — not a real page. */
const EXCLUDED_PAGES = new Set(['offline.html']);

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

function decodeEntities(value) {
  return value.replace(/&(amp|lt|gt|quot|#39);/g, (match) => ENTITIES[match] ?? match);
}

/** Every `<meta ...>` tag in the document, in source order. */
function metaTags(html) {
  return html.match(/<meta\s[^>]*>/gi) ?? [];
}

function attr(tag, name) {
  // The attribute must start after whitespace, so `site_name=` never reads as
  // `name=`.
  const match = tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`, 'i'));
  return match ? decodeEntities(match[1]) : '';
}

/** The content of every `<meta name="...">` tag, in document order. */
function metaValues(html, name) {
  return metaTags(html)
    .filter((tag) => attr(tag, 'name').toLowerCase() === name.toLowerCase())
    .map((tag) => attr(tag, 'content'));
}

/** The content of every `<meta property="...">` tag, in document order. */
function propertyValues(html, property) {
  return metaTags(html)
    .filter((tag) => attr(tag, 'property').toLowerCase() === property.toLowerCase())
    .map((tag) => attr(tag, 'content'));
}

/** Every `<title>...</title>` body, in document order. */
function titleValues(html) {
  return [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((match) =>
    decodeEntities(match[1].trim()),
  );
}

/** Every `<link rel="canonical" href="...">`, in document order. */
function canonicalValues(html) {
  return [...html.matchAll(/<link\s[^>]*>/gi)]
    .filter((tag) => attr(tag[0], 'rel').toLowerCase() === 'canonical')
    .map((tag) => attr(tag[0], 'href'));
}

/** Every `index.html` under `dist`, as a path relative to `dist`. */
async function findPageFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await findPageFiles(path.join(dir, entry.name), relative)));
    } else if (entry.name === 'index.html') {
      files.push(relative);
    }
  }
  return files;
}

/** The canonical URL a built page is expected to carry. */
function urlForPage(relativePath) {
  const dir = path.posix.dirname(relativePath);
  return `${SITE}${dir === '.' ? '/' : `/${dir}`}`;
}

/** Every JS asset in the build — where a runtime-injected analytics id lands. */
async function readScriptAssets() {
  const assetsDir = path.join(DIST, 'assets');
  let entries;
  try {
    entries = await readdir(assetsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const sources = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    sources.push(await readFile(path.join(assetsDir, entry.name), 'utf8'));
  }
  return sources;
}

async function main() {
  let pageFiles;
  try {
    pageFiles = await findPageFiles(DIST);
  } catch (err) {
    console.error(`✗ Cannot read ${DIST} — run "npm run build" first (${err.message})`);
    process.exitCode = 1;
    return;
  }

  const pages = pageFiles
    .filter((file) => !EXCLUDED_PAGES.has(path.posix.basename(file)))
    .sort();

  if (pages.length === 0) {
    console.error(`✗ No built pages found in ${DIST} — run "npm run build" first`);
    process.exitCode = 1;
    return;
  }

  const failures = [];
  const fail = (page, message) => failures.push(`${page}: ${message}`);

  const titleCounts = new Map();
  const descriptionCounts = new Map();
  const measurementId = (process.env.VITE_GA4_MEASUREMENT_ID ?? '').trim();
  const scriptAssets = measurementId ? await readScriptAssets() : [];
  const measurementIdInAssets = measurementId
    ? scriptAssets.some((source) => source.includes(measurementId))
    : false;

  for (const file of pages) {
    const html = await readFile(path.join(DIST, file), 'utf8');
    const expectedUrl = urlForPage(file);

    const titles = titleValues(html);
    if (titles.length !== 1) {
      fail(file, `expected exactly one <title>, found ${titles.length}`);
    } else if (!titles[0]) {
      fail(file, 'the <title> is empty');
    } else {
      titleCounts.set(titles[0], [...(titleCounts.get(titles[0]) ?? []), file]);
    }

    const descriptions = metaValues(html, 'description');
    if (descriptions.length !== 1) {
      fail(file, `expected exactly one meta[name="description"], found ${descriptions.length}`);
    } else if (!descriptions[0].trim()) {
      fail(file, 'meta[name="description"] is empty');
    } else {
      descriptionCounts.set(descriptions[0], [
        ...(descriptionCounts.get(descriptions[0]) ?? []),
        file,
      ]);
    }

    const keywords = metaValues(html, 'keywords');
    if (keywords.length !== 1) {
      fail(file, `expected exactly one meta[name="keywords"], found ${keywords.length}`);
    } else if (!keywords[0].trim()) {
      fail(file, 'meta[name="keywords"] is empty');
    }

    const canonicals = canonicalValues(html);
    if (canonicals.length !== 1) {
      fail(file, `expected exactly one link[rel="canonical"], found ${canonicals.length}`);
    } else if (canonicals[0] !== expectedUrl) {
      fail(file, `canonical is "${canonicals[0]}", expected "${expectedUrl}"`);
    }

    for (const property of ['og:title', 'og:description', 'og:url', 'og:type']) {
      const values = propertyValues(html, property);
      if (values.length === 0) {
        fail(file, `meta[property="${property}"] is missing`);
      } else if (!values[0].trim()) {
        fail(file, `meta[property="${property}"] is empty`);
      }
    }

    for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
      const values = metaValues(html, name);
      if (values.length === 0) {
        fail(file, `meta[name="${name}"] is missing`);
      } else if (!values[0].trim()) {
        fail(file, `meta[name="${name}"] is empty`);
      }
    }

    if (!html.includes('googletagmanager.com/gtm.js')) {
      fail(file, 'the Google Tag Manager loader is missing');
    }
    if (measurementId && !measurementIdInAssets && !html.includes(measurementId)) {
      fail(file, `the GA4 measurement ID "${measurementId}" appears in neither the page nor the bundle`);
    }
  }

  for (const [title, files] of titleCounts) {
    if (files.length > 1) {
      fail(files.join(', '), `duplicate title "${title}"`);
    }
  }
  for (const [description, files] of descriptionCounts) {
    if (files.length > 1) {
      fail(files.join(', '), `duplicate description "${description.slice(0, 60)}…"`);
    }
  }

  // The sitemap and the built pages must describe the same site.
  let sitemap = '';
  try {
    sitemap = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
  } catch {
    fail('sitemap.xml', 'dist/sitemap.xml is missing');
  }
  if (sitemap) {
    const locs = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) =>
      decodeEntities(match[1].trim()),
    );
    const locSet = new Set(locs);
    const pageUrls = new Set(pages.map(urlForPage));

    for (const url of pageUrls) {
      if (!locSet.has(url)) fail('sitemap.xml', `no <loc> for the built page ${url}`);
    }
    for (const loc of locSet) {
      if (!pageUrls.has(loc)) fail('sitemap.xml', `<loc>${loc}</loc> has no built page`);
    }
  }

  let robots = '';
  try {
    robots = await readFile(path.join(DIST, 'robots.txt'), 'utf8');
  } catch {
    fail('robots.txt', 'dist/robots.txt is missing');
  }
  if (robots && !robots.includes('sitemap.xml')) {
    fail('robots.txt', 'does not reference the sitemap');
  }

  if (failures.length > 0) {
    console.error(`✗ SEO check failed — ${failures.length} problem(s) in ${pages.length} page(s):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `✓ SEO check passed — ${pages.length} page(s) carry a title, description, keywords, canonical, OG and Twitter tags; every title and description is unique; sitemap and robots.txt agree`,
  );
}

main().catch((err) => {
  console.error(`✗ SEO check failed: ${err?.message ?? err}`);
  process.exitCode = 1;
});
