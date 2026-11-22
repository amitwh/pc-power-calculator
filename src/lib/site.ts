/**
 * The origin of the deployed site.
 *
 * Why it lives in its own module: the canonical tags, the sitemap, the report
 * footers and the share links all have to name the same host, and a report
 * that names a different one from the page it came from is worse than no
 * address at all. One constant, imported by all of them, means they cannot
 * disagree — and a change of domain is a change in one place.
 *
 * It deliberately has no imports. `lib/seo/routeMeta` pulls in the whole
 * guide catalogue, and the report renderer is a separate lazy chunk that has
 * no business carrying it.
 */
export const SITE = 'https://pcpower.concreteinfo.net';

/** The bare host, for display — SITE carries the scheme. */
export const SITE_HOST = SITE.replace(/^https?:\/\//, '');
