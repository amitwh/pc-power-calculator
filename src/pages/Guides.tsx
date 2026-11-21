import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/analytics/adsense';
import { GUIDE_CATEGORIES, GUIDES } from '@/content/guides';

// Why: the guide content moved to `@/content/guides`, but the nav, the page
// meta hook, the prerender manifest and the tests all import `GUIDES` from
// this page. Re-exporting keeps those import paths working.
export { GUIDES } from '@/content/guides';
export type { Guide, GuideCategory } from '@/content/guides';

function GuideArticle({ slug }: { slug: string }) {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <PageHeader title="Guide not found" />
        <p className="text-sm">
          That guide doesn't exist. See all{' '}
          <Link to="/guides" className="text-brand-text underline underline-offset-2">guides</Link>.
        </p>
      </div>
    );
  }
  return (
    <article className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader
        title={guide.title}
        lede={`${guide.minutes} min read · Updated ${guide.updated}`}
      />
      <div className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-2 [&_p]:my-2 [&_strong]:text-gray-900 dark:[&_strong]:text-gray-50">
        {guide.body}
      </div>
      {/* Below the answer — never between a reader and the numbers they came
          for. Renders nothing until an ad unit is set. */}
      <AdSlot slot={AD_SLOTS.guideInline} />
    </article>
  );
}

/** The hub (`/guides`): the guides grouped by category, with a live filter. */
function GuidesHub() {
  const [query, setQuery] = useState('');

  // Why: a single word is what most people type, but "gaming power" should
  // still find the gaming guide — so every typed word has to appear
  // somewhere in a guide, and the title, the description and the tags all
  // count.
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = GUIDES.filter((guide) => {
    if (terms.length === 0) return true;
    const haystack = `${guide.title} ${guide.description} ${guide.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
  const searching = terms.length > 0;

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader
        title="Guides & explainers"
        lede="Short, practical reads on PC power draw, PSU sizing and electricity billing — written to match the calculator's model."
      />

      <div className="mb-6 grid gap-1.5">
        <label className="text-sm font-semibold" htmlFor="guides-search">
          Search guides
        </label>
        <input
          id="guides-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by topic, part or keyword"
          className="w-full min-h-11 rounded-8 border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No guides match that search.</p>
      ) : (
        <div className="grid gap-8">
          {GUIDE_CATEGORIES.map((category) => {
            const guides = filtered.filter((guide) => guide.category === category.id);
            // Why: an unfiltered hub shows every section — the hardware
            // section is visible before it has any articles — but once a
            // search is running, a section with no hits is dropped rather than
            // left behind as an empty heading.
            if (guides.length === 0 && searching) return null;
            return (
              <section key={category.id}>
                <h2 className="font-display text-lg font-bold">{category.label}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{category.blurb}</p>
                {guides.length > 0 && (
                  <div className="grid gap-3 mt-3">
                    {guides.map((g) => (
                      <Card key={g.slug}>
                        <CardTitle>
                          <Link to={`/guides/${g.slug}`} className="hover:text-brand-dark">
                            {g.title}
                          </Link>
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{g.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{g.minutes} min read · Updated {g.updated}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Guides hub (`/guides`) and article view (`/guides/:slug`). */
export default function Guides() {
  const { slug } = useParams();
  if (slug) return <GuideArticle slug={slug} />;

  return <GuidesHub />;
}
