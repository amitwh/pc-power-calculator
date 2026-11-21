# SEO plan — PC Power Calculator

Started 2026-11-21. The goal is not "more pages"; it is to be the page that
answers *"what does X cost to run"* better than a forum thread does.

## What already exists (verified this pass)

| Layer | State |
|---|---|
| Indexable routes | 366 prerendered HTML files, one per part / cost / guide page |
| Sitemap | `/sitemap.xml`, 366 URLs, generated at build |
| Canonicals | One self-referencing canonical per route |
| Soft-404s | Unknown paths get `noindex, follow` and lose the canonical |
| Structured data | `WebSite`, `WebApplication`, `Organization`, `Article` (guides), `BreadcrumbList` on every nested page |
| Titles / descriptions | Per-route, unique (`src/entry-server.tsx`) |
| URLs | Real paths, no hash routing; `/build/<token>` is per-user and must stay out of the sitemap |
| Machine-readable data | `/data` page + JSON endpoints per dataset |

**Gap:** none of this rewrites a title for a query that is already winning
impressions. That is the loop that has not started yet.

## The query families worth owning

Ordered by intent strength × our ability to be the best answer.

1. **"how much does it cost to run a <use case>"** — gaming PC, NAS, homelab
   server, 24×7 media server, mining rig. We can answer with a calculator
   pre-seeded for that use case.
2. **"<part> power consumption"** — per-part pages exist; they need a visible
   "how much does it cost per year" table, not just watts.
3. **"PSU size for <gpu>"** — high volume, low competition from calculators
   that model efficiency.
4. **"electricity cost of running a PC 24/7 India"** — regional tariff angle;
   we already hold state-level tariff data.
5. **"kWh per month for a PC"** — top-of-funnel unit conversion.

## Next pages to build (in order)

1. `/cost-to-run/<use-case>` — five pages: `gaming-pc`, `nas`, `homelab`,
   `media-server`, `workstation`. Each pre-seeds the calculator with a typical
   build for that use case and shows the yearly figure above the fold.
2. `/psu-size/<gpu>` — top 40 GPUs; recommended PSU at 70% and 100% load, with
   the efficiency curve shown.
3. `/parts/<id>` improvements — add a "cost per year at 4 h/day and 24×7" table
   plus `estimated/measured` basis, so the page answers cost not just watts.
4. Guide cluster: one pillar ("What a PC costs to run") linking to every
   use-case page, with `HowTo` schema on the procedural articles.

## Rules

- **No fabricating content for a schema.** `FAQPage` only where the Q&A is
  visible on the page.
- Every new page needs: a unique title, a description written for the query,
  one canonical, a breadcrumb, and an internal link from the pillar.
- Use-case pages must show a real number in the first screen — that is the
  whole differentiator against forum threads.
- Never index `/build/<token>` (user content, unbounded).

## Measurement loop (monthly)

1. GSC → queries with >500 impressions and CTR <2% → rewrite title/meta.
2. GSC → positions 8–20 with clicks → expand and add internal links.
3. Track per cluster: clicks, impressions, average position, top-10 count.

The first review should happen 30 days after the use-case pages go live; there
is nothing to measure until those exist.
