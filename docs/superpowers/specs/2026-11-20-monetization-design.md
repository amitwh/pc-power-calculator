# Monetization — place the inventory, gate the revenue

**Date:** 2026-11-20
**Status:** proposed (Project 4 of 4)
**Depends on:** the 363 prerendered routes being indexed; ads and affiliate links are worthless on pages nobody reaches.

## What already exists

| Piece | State |
|---|---|
| `AdSlot` component | Built, consent-gated, renders `null` unless `VITE_ADSENSE_CLIENT` is set **and** the visitor opted in |
| `lib/analytics/adsense.ts` | Loader, non-personalized by default, fail-open |
| Consent banner | Built; `getConsent()` gates both ads and GA4 |
| CSP | AdSense hosts already allowlisted (script/connect/img/frame) |
| `public/ads.txt` | Present with the correct `f08c47fec0942fa0` record, publisher ID commented out |
| Affiliate links | **Not built** — and should not be, until a program is approved |

So Project 4 is not "build ads". It is: put the slots where the traffic is, and make the switch-on path one env var plus one line of ads.txt.

## Work items

### 4a. Ad inventory on the content surfaces (code, harmless now)
Place `AdSlot` on the pages that will actually be read, not just the app shell:
- guide article — one unit after the intro paragraph, one before the closing disclaimer
- part page — one unit below the cost table (after the reader has their answer)
- tariff page — one unit below the worked examples

All render nothing today. No layout shift is introduced because the component returns `null` when disabled; when enabled, reserve height on the wrapper to avoid CLS.

**Rejected:** interstitials, sticky bottom units, ads above the first answer. The first job of these pages is to answer the query; an ad that pushes the answer below the fold trades long-term ranking for a few impressions.

### 4b. Switch-on path (ops, needs a human)
1. AdSense approval → publisher ID.
2. Uncomment and set the `google.com, pub-…` line in `public/ads.txt`; redeploy.
3. Set `VITE_ADSENSE_CLIENT=ca-pub-…` in Coolify → redeploy.
4. Verify: unit renders only after consent; `ads.txt` fetchable at the apex domain.

No code changes between steps 1 and 4 — that is the point of the current design.

### 4c. Affiliate (blocked, deliberately)
A part page is the natural place to say "this is where to buy it", and affiliate programs (Amazon Associates, retailer programs) pay on click-through. It is not implemented because:
- links without an approved account earn nothing and add outbound weight;
- disclosed affiliate links need a visible disclosure, which is a content change, not a styling one.

When an account exists: one config module (`VITE_AFFILIATE_TAG`), a `BuyLinks` component rendered only when configured, and a disclosure line on every page that carries one. Until then, `Part.tsx` links only to the calculator and to other parts.

### 4d. Measurement
The GSC loop (Project 3's tail) is the real instrument: without impressions there is nothing to monetize. Track per route: clicks, impressions, average position. Ads and affiliate revenue are downstream metrics, not leading ones.

## Non-goals
- Paywalls, accounts, email capture — they contradict the "no sign-up, nothing uploaded" promise the app makes.
- Ads on the calculator itself: it is the conversion surface (share, export), and ads there cost more in trust than they return.

## Risks

| Risk | Mitigation |
|---|---|
| Ads degrade LCP/CLS on the pages meant to rank | Below-the-answer placement + reserved height; re-check Lighthouse after switch-on |
| Thin ad-only pages (part pages with no reader) | Tranche gate is GSC indexing, not page count; ads follow traffic |
| Consent banner interaction with AdSense CMP requirements | Ads already request non-personalized; EEA personalization would need a certified CMP and is explicitly out of scope |
