/**
 * "PSU sizing explained: why we add 35% headroom"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import type { Guide } from './types';

export const psuSizing: Guide = {
  slug: 'psu-sizing',
  title: 'PSU sizing explained: why we add 35% headroom',
  description:
    'Why the right PSU is bigger than your peak draw: efficiency curves, GPU transient spikes, and ageing — explained simply.',
  minutes: 5,
  updated: 'November 2026',
  category: 'power',
  tags: ['psu sizing', 'power supply', 'headroom', '80 plus', 'wattage', 'efficiency'],
  body: (
    <>
      <p>
        The internet's classic PSU advice — “add up the wattage and buy that” — produces
        systems that run their power supply at 100% load every gaming session. That's a bad
        place to operate, for four separate reasons. This is why the calculator adds a
        <strong> 35% sizing margin</strong> on top of peak draw when it recommends a PSU.
      </p>

      <h2>1. Efficiency peaks near half load</h2>
      <p>
        A PSU's 80-Plus rating is measured at 20%, 50% and 100% load — and for most units the
        curve peaks around 40–60%. A 450 W build on a 450 W PSU runs at ~100% load, in the
        least efficient region of its curve. The same build on a 650 W Gold unit sits near
        60%… but 550 W would be even closer to the sweet spot. More headroom is not always
        more efficient — <em>right-sized</em> headroom is.
      </p>

      <h2>2. Transient spikes burst far above rated draw</h2>
      <p>
        Modern GPUs can spike to roughly <strong>double their nameplate power for a few
        milliseconds</strong> when loading a level or recovering from a frame-time dip. A PSU
        running near 100% has no reserve for that spike and its protection circuitry may
        trip — the classic “random black screen while gaming, no crash log” complaint. Extra
        capacity absorbs spikes silently.
      </p>

      <h2>3. Capacitors age</h2>
      <p>
        Electrolytic capacitors lose capacity over years, especially with heat. A unit that
        delivered its full rated wattage on day one may deliver measurably less by year five.
        Headroom is what turns “the PSU dies eventually” into “the PSU is replaced on your
        schedule, during a planned upgrade”.
      </p>

      <h2>4. Upgrades shouldn't force a PSU swap</h2>
      <p>
        The GPU you buy in three years will likely draw more. A 35% margin means today's PSU
        almost certainly survives one GPU generation.
      </p>

      <h2>How this calculator models it</h2>
      <p>
        The recommended PSU is: sum of every component's <strong>rated (100%)</strong> draw,
        plus a 35% margin, rounded up to a commonly sold wattage. Running costs use the
        opposite assumption — components average ~70% of rated draw in real use — and the
        wall draw divides by the 80-Plus efficiency curve interpolated at the actual load
        percentage. Both the model and its limits are documented in{' '}
        <Link to="/about" className="text-brand-text underline underline-offset-2">About &amp; methodology</Link>.
      </p>

      <p>
        Rule of thumb to take away: <strong>peak draw × 1.35, then buy a quality tier
        (80-Plus Bronze minimum, Gold preferred) at or above that number</strong>. If you're
        unsure what your peak is, let the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        add it up — it knows the ratings of 2,200+ parts, including the exact GPU on your
        shortlist.
      </p>
    </>
  ),
};
