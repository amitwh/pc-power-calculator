// Merge catalog part-files (src/data/catalog-parts/*.json) into
// src/data/components.json, validating schema and deduping.
// Usage: node scripts/merge-catalog.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PARTS_DIR = join(ROOT, 'src/data/catalog-parts');
const OUT = join(ROOT, 'src/data/components.json');

const VALID_CATEGORIES = new Set([
  'cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu',
  'cooler', 'monitor', 'add_in_card', 'optical_drive', 'ups', 'peripheral',
]);

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Kebab-safe id: lowercase, collapse disallowed runs (parens, spaces, dots) to '-'. */
const sanitizeId = (id) =>
  String(id).toLowerCase().replace(/[^a-z0-9+-]+/g, '-').replace(/^-+|-+$/g, '');

function validateEntry(e, origin) {
  const problems = [];
  const req = ['id', 'category', 'brand', 'model', 'releaseYear', 'tdp_w', 'specs', 'source', 'addedAt'];
  for (const k of req) if (!(k in e)) problems.push(`missing field "${k}"`);
  if (!VALID_CATEGORIES.has(e.category)) problems.push(`bad category "${e.category}"`);
  // Kebab-case ids; '+' allowed for performance-rated SKUs ("Athlon 64 3200+").
  if (typeof e.id !== 'string' || !/^[a-z0-9][a-z0-9+-]*$/.test(sanitizeId(e.id))) problems.push(`bad id "${e.id}"`);
  if (!Number.isInteger(e.releaseYear) || e.releaseYear < 2000 || e.releaseYear > 2026) {
    problems.push(`bad releaseYear ${e.releaseYear}`);
  }
  if (e.tdp_w !== null && (typeof e.tdp_w !== 'number' || !Number.isFinite(e.tdp_w) || e.tdp_w < 0)) {
    problems.push(`bad tdp_w ${e.tdp_w}`);
  }
  if (typeof e.specs !== 'object' || e.specs === null || Array.isArray(e.specs)) problems.push('bad specs');
  if (problems.length) throw new Error(`${origin} entry ${e.id || '(no id)'}: ${problems.join('; ')}`);
}

const dest = JSON.parse(readFileSync(OUT, 'utf8'));
const merged = [];
const skipped = [];
const seenIds = new Set();
const seenModels = new Set();

// First pass over the EXISTING entries: drop pre-existing duplicates (keep the
// first occurrence of each (category, brand, model) and each id).
let existingDupes = 0;
for (const c of dest.components) {
  const idKey = c.id;
  const modelKey = `${c.category}|${norm(c.brand)}|${norm(c.model)}`;
  if (seenIds.has(idKey) || seenModels.has(modelKey)) {
    skipped.push(`existing duplicate dropped: ${idKey}`);
    existingDupes++;
    continue;
  }
  seenIds.add(idKey);
  seenModels.add(modelKey);
  merged.push(c);
}

let added = 0;
const files = readdirSync(PARTS_DIR).filter((f) => f.endsWith('.json')).sort();

for (const file of files) {
  const arr = JSON.parse(readFileSync(join(PARTS_DIR, file), 'utf8'));
  if (!Array.isArray(arr)) throw new Error(`${file}: expected a JSON array`);
  for (const e of arr) {
    validateEntry(e, file);
    e.id = sanitizeId(e.id);
    if (seenIds.has(e.id)) {
      skipped.push(`${basename(file)}: duplicate id ${e.id}`);
      continue;
    }
    const modelKey = `${e.category}|${norm(e.brand)}|${norm(e.model)}`;
    if (seenModels.has(modelKey)) {
      skipped.push(`${basename(file)}: duplicate model ${e.brand} ${e.model} (${e.category})`);
      continue;
    }
    seenIds.add(e.id);
    seenModels.add(modelKey);
    merged.push(e);
    added++;
  }
}

// Stable, human-browsable order: category → brand → year → model.
const CAT_ORDER = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'cooler', 'monitor', 'add_in_card', 'optical_drive', 'ups', 'peripheral'];
merged.sort(
  (a, b) =>
    CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category) ||
    a.brand.localeCompare(b.brand) ||
    a.releaseYear - b.releaseYear ||
    a.model.localeCompare(b.model),
);

const today = new Date().toISOString().slice(0, 10);
const out = {
  version: today,
  lastUpdated: today,
  components: merged,
};

writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

const byCat = {};
for (const c of merged) byCat[c.category] = (byCat[c.category] || 0) + 1;
console.log(`Merged: ${merged.length} entries total (+${added} new, ${skipped.length} skipped incl. ${existingDupes} pre-existing duplicates)`);
console.log('By category:', byCat);
const years = merged.map((c) => c.releaseYear);
console.log(`Year range: ${Math.min(...years)}–${Math.max(...years)}`);
if (skipped.length) {
  console.log('Skipped:');
  for (const s of skipped) console.log('  -', s);
}
