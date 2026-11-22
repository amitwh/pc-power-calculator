import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Search, SearchX } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/analytics/adsense';
import { GUIDE_CATEGORIES, GUIDE_CATEGORY_STYLES, GUIDES } from '@/content/guides';
import { GUIDES_DESCRIPTION } from '@/lib/seo/routeMeta';
import type { Guide, GuideCategory } from '@/content/guides';

// Why: the guide content moved to `@/content/guides`, but the nav, the page
// meta hook, the prerender manifest and the tests all import `GUIDES` from
// this page. Re-exporting keeps those import paths working.
export { GUIDES } from '@/content/guides';
export type { Guide, GuideCategory };

/**
 * Brand-coloured *text* that sits on a card surface.
 *
 * Why: the brand's own bright orange (#ff6b47) scores 3.3:1 on the app's
 * gray-900 dark card — enough for a glyph, which only needs 3:1, but a label
 * needs 4.5:1. Orange-300 is the same warm family lifted until it clears AA
 * on gray-900 (5.6:1) — the same lift `lib/categoryColors.ts` gives every
 * badge hue for the dark surface.
 */
const BRAND_TEXT = 'text-brand-text dark:text-orange-300';

/** The active filter pill: brand-tinted, with the brand text colour. */
const PILL_ACTIVE =
  'border-brand/30 bg-brand/10 text-brand-text dark:border-brand/40 dark:bg-brand/15 dark:text-orange-300';
/** An inactive filter pill: neutral, gaining the brand tint on hover. */
const PILL_INACTIVE =
  'border-gray-200 bg-white text-gray-700 hover:border-brand/40 hover:bg-brand/5 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand/40 dark:hover:bg-brand/10';
/** The focus ring every control on this page shares. */
const PILL_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950';

/** How many guides sit in each category — the counts on the hero chips. */
function countInCategory(id: GuideCategory): number {
  return GUIDES.filter((guide) => guide.category === id).length;
}

/**
 * One guide, as a card in the hub grid.
 *
 * Why the title is the only link: a card-wide link would take its accessible
 * name from everything inside it — title, description, tags, footer — and the
 * page's own link query (`getByRole('link', { name: guide.title })`) would
 * stop matching. So the title carries the link and the card's other content
 * is painted above the stretched pseudo-element, which keeps the text
 * selectable and the icon tile clickable.
 */
function GuideCard({ guide }: { guide: Guide }) {
  const style = GUIDE_CATEGORY_STYLES[guide.category];
  const Icon = guide.icon;
  return (
    <div
      className={`group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-card-raised motion-safe:hover:-translate-y-0.5 dark:border-gray-800 dark:bg-gray-900 ${style.cardHover}`}
    >
      <div className="flex items-start gap-3">
        {/* The tile repeats the category colour, so the hub scans as tinted
            groups rather than a wall of identical white cards. */}
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${style.tile} ${style.icon} group-hover:bg-brand/10 group-hover:text-brand-text dark:group-hover:text-brand-light`}
        >
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            to={`/guides/${guide.slug}`}
            className="line-clamp-2 text-sm font-semibold text-gray-900 after:absolute after:inset-0 after:content-[''] dark:text-gray-100 group-hover:text-brand-text dark:group-hover:text-orange-300"
          >
            {guide.title}
          </Link>
          <p className="relative mt-0.5 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">
            {guide.description}
          </p>
        </div>
      </div>
      {/* Three tags is the most that fits one line at a card's width — a
          fourth turns the chip row into a third line of text. */}
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {guide.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            {tag}
          </span>
        ))}
      </div>
      {/* `mt-auto` pushes the footer to the bottom of the card, so in a row of
          four the footers line up instead of floating at different heights. */}
      <p className="relative mt-auto border-t border-gray-100 pt-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-300">
        {guide.minutes} min read · Updated {guide.updated}
      </p>
    </div>
  );
}

function GuideArticle({ slug }: { slug: string }) {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <PageHeader title="Guide not found" />
        <p className="text-sm">
          That guide doesn't exist. See all{' '}
          <Link to="/guides" className="text-brand-text underline underline-offset-2 dark:text-brand-light">guides</Link>.
        </p>
      </div>
    );
  }
  const style = GUIDE_CATEGORY_STYLES[guide.category];
  const CategoryIcon = style.symbol;
  return (
    <article className="mx-auto max-w-3xl p-4 md:p-8">
      {/* A reader who arrived from a search result has no other way back to
          the hub, so the link sits above the title rather than below it. */}
      <Link
        to="/guides"
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-brand-text dark:text-gray-400 dark:hover:text-orange-300"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
        All guides
      </Link>

      <div className="mt-3 mb-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold dark:border-gray-800 dark:bg-gray-900">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full ${style.tile}`}
          >
            <CategoryIcon aria-hidden className={`h-3 w-3 ${style.icon}`} />
          </span>
          <span className={style.accent}>{style.label}</span>
        </span>
      </div>

      <PageHeader
        title={guide.title}
        lede={`${guide.minutes} min read · Updated ${guide.updated}`}
      />
      {/* The prose links carry their colour from the wrapper rather than from
          each link: `--color-brand-text` is a deep red that clears AA on white
          but only reaches 2.8:1 on the dark page, so in dark mode every link
          inside an article fell below the 4.5:1 text threshold. The bright
          brand tone clears it comfortably on the dark surface. */}
      <div className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-2 [&_p]:my-2 [&_strong]:text-gray-900 dark:[&_strong]:text-gray-50 [&_a]:text-brand-text dark:[&_a]:text-brand-light [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border-b [&_th]:border-gray-300 [&_th]:py-1.5 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold dark:[&_th]:border-gray-700 [&_td]:border-b [&_td]:border-gray-100 [&_td]:py-1.5 [&_td]:pr-3 [&_td]:align-top dark:[&_td]:border-gray-800 [&_table_caption]:text-left [&_table_caption]:text-xs [&_table_caption]:text-gray-500">
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
  const [category, setCategory] = useState<GuideCategory | 'all'>('all');

  // Why: a single word is what most people type, but "gaming power" should
  // still find the gaming guide — so every typed word has to appear
  // somewhere in a guide, and the title, the description and the tags all
  // count.
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const narrowing = terms.length > 0 || category !== 'all';
  const filtered = GUIDES.filter((guide) => {
    if (category !== 'all' && guide.category !== category) return false;
    if (terms.length === 0) return true;
    const haystack = `${guide.title} ${guide.description} ${guide.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });

  const total = GUIDES.length;
  const countText = narrowing
    ? `Showing ${filtered.length.toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')} guides`
    : `${total.toLocaleString('en-IN')} guides`;

  const clearAll = () => {
    setQuery('');
    setCategory('all');
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-8">
      {/* The hero. A browse page wants a wide canvas, so the hub sits in the
          app's 1240px measure rather than the 768px reading measure — at 768px
          there is room for exactly one column and 26 guides become an endless
          scroll. */}
      <section className="relative overflow-hidden rounded-16 border border-gray-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-900 md:p-10">
        {/* A soft brand wash bleeding in from the corner. Decorative, so it
            stays out of the accessibility tree. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="relative">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${BRAND_TEXT}`}>
            PC hardware, explained
          </p>
          {/* Visible page title. Layout already renders the route's single h1
              (visually hidden), so this stays a styled paragraph to keep
              exactly one h1 in the accessibility tree. */}
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-50 md:text-4xl">
            Guides &amp; explainers
          </p>
          {/* Why the import: the visible lede and the page's meta description
              describe the same collection, so they read the same string — one
              place to change, and no chance of the two drifting apart. */}
          <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            {GUIDES_DESCRIPTION}
          </p>
          {/* One chip per category: the colour, the name and how many guides
              sit behind it. The chips are the page's colour signal, so the
              count is never the only thing distinguishing them. */}
          <div className="mt-5 flex flex-wrap gap-2">
            {GUIDE_CATEGORIES.map((item) => {
              const style = GUIDE_CATEGORY_STYLES[item.id];
              const Icon = style.symbol;
              const active = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(active ? 'all' : item.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${
                    active
                      ? 'border-brand/50 bg-brand/10 dark:border-brand/40 dark:bg-brand/15'
                      : `border-transparent ${style.chip} hover:border-brand/40`
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-900 ${style.icon}`}
                  >
                    <Icon aria-hidden className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-gray-800 dark:text-gray-100">{item.label}</span>
                  <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">
                    {countInCategory(item.id).toLocaleString('en-IN')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* The search and filter row. Sticky, so a reader can narrow the list
          without scrolling back to the top — the page is long and the whole
          point of the redesign is that scrolling should not be painful. It is
          a sibling of the sections below, not wrapped in a short container,
          because a sticky element whose containing block is shorter than the
          viewport pins for a few pixels and then scrolls away. */}
      <div className="z-30 -mx-4 border-b border-gray-200 bg-white px-4 py-3 md:sticky md:top-16 md:-mx-8 md:px-8 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative sm:max-w-md sm:flex-1">
            <label htmlFor="guides-search" className="sr-only">
              Search guides
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              id="guides-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by topic, part or keyword"
              className="w-full min-h-11 rounded-12 border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
            />
          </div>
          {/* Announced as it changes, so a screen-reader user hears the list
              narrow without having to go looking for it. */}
          <p
            aria-live="polite"
            className="shrink-0 text-xs text-gray-500 dark:text-gray-400"
          >
            {countText}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${PILL_FOCUS} ${
              category === 'all' ? PILL_ACTIVE : PILL_INACTIVE
            }`}
          >
            <LayoutGrid aria-hidden className="h-3.5 w-3.5" />
            All
          </button>
          {GUIDE_CATEGORIES.map((item) => {
            const style = GUIDE_CATEGORY_STYLES[item.id];
            const Icon = style.symbol;
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(active ? 'all' : item.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${PILL_FOCUS} ${
                  active ? PILL_ACTIVE : PILL_INACTIVE
                }`}
              >
                <Icon aria-hidden className={`h-3.5 w-3.5 ${style.icon}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-16 border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <SearchX
            aria-hidden
            className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500"
          />
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            No guides match that search.
          </p>
          <Button variant="secondary" size="sm" onClick={clearAll} className="mt-4">
            Clear search
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {GUIDE_CATEGORIES.map((item) => {
            const guides = filtered.filter((guide) => guide.category === item.id);
            // Why: an unfiltered hub shows every section — the hardware
            // section is visible before it has any articles — but once the
            // list is narrowed, a section with no hits is dropped rather than
            // left behind as an empty heading.
            if (guides.length === 0 && narrowing) return null;
            const style = GUIDE_CATEGORY_STYLES[item.id];
            const Icon = style.symbol;
            return (
              <section key={item.id}>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.tile}`}
                  >
                    <Icon aria-hidden className={`h-5 w-5 ${style.icon}`} />
                  </span>
                  <div>
                    <h2
                      className={`font-display text-lg font-bold ${style.accent}`}
                    >
                      {item.label}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.blurb}</p>
                  </div>
                </div>
                {guides.length > 0 && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {guides.map((guide) => (
                      <GuideCard key={guide.slug} guide={guide} />
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
