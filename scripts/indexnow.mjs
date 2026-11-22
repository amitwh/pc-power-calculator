// Submit every URL in the built sitemap to IndexNow (Bing, Yandex and other
// participating engines).
//
// Run this *after* a production deploy: the engine fetches
// https://pcpower.concreteinfo.net/<key>.txt to prove ownership, so the key
// file must already be live. Google does not participate in IndexNow and has
// no equivalent ping endpoint — use Search Console's URL inspection for it.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const SITEMAP = path.join(ROOT, 'dist', 'sitemap.xml');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const HOST = 'pcpower.concreteinfo.net';
const KEY_PATTERN = /^[a-f0-9]{32}\.txt$/;

/** The IndexNow key lives in its own public file, named after the key. */
async function findKey() {
  const matches = (await readdir(PUBLIC)).filter((name) => KEY_PATTERN.test(name));
  if (matches.length === 0) {
    throw new Error(`No 32-hex key file found in ${PUBLIC}`);
  }
  if (matches.length > 1) {
    throw new Error(`Several key files found in ${PUBLIC}: ${matches.join(', ')}`);
  }
  const key = matches[0].replace(/\.txt$/, '');
  const content = (await readFile(path.join(PUBLIC, matches[0]), 'utf8')).trim();
  if (content !== key) {
    throw new Error(`${matches[0]} must contain exactly the key "${key}"`);
  }
  return key;
}

/** Every absolute URL in dist/sitemap.xml, in document order. */
async function sitemapUrls() {
  const xml = await readFile(SITEMAP, 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (urls.length === 0) throw new Error(`No <loc> entries found in ${SITEMAP}`);
  return urls;
}

async function main() {
  const key = await findKey();
  const urlList = await sitemapUrls();

  const body = {
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList,
  };

  console.log(`Submitting ${urlList.length} URLs to ${ENDPOINT}`);
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  console.log(`HTTP ${response.status} ${response.statusText}`);
  if (text) console.log(text);

  if (!response.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`IndexNow submission failed: ${err?.message ?? err}`);
  process.exitCode = 1;
});
