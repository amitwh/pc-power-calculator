/**
 * "Understanding your electricity bill in India (and where your PC fits in it)"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import { rupee } from './format';
import type { Guide } from './types';

export const indiaTariff: Guide = {
  slug: 'india-tariff',
  title: 'Understanding your electricity bill in India (and where your PC fits in it)',
  description:
    'Slab tariffs, fixed charges and electricity duty — how Indian billing actually works, and what a PC really adds to it.',
  minutes: 6,
  updated: 'November 2026',
  category: 'billing',
  tags: ['electricity bill', 'tariff slabs', 'india', 'slab rate', 'electricity duty', 'fixed charge'],
  body: (
    <>
      <p>
        Indian homes don't pay one flat rate per unit (kWh). Almost every state's distributor
        bills residential customers on a <strong>telescopic slab</strong> structure, and once
        you understand it, you can see exactly where a PC's consumption lands on your bill —
        often it's cheaper than people fear, because a PC adds <em>marginal</em> units at the
        top of the slab, not at the average rate.
      </p>

      <h2>The anatomy of a typical bill</h2>
      <ul>
        <li><strong>Energy charges (slabs)</strong> — e.g. 0–100 units at one rate,
          101–300 at a higher rate, 301–500 higher still, above that the highest. Rates vary
          by state and by consumer category; urban residential slabs commonly run from
          ~₹3–5/kWh in the first slab to ~₹9–12/kWh at the top.</li>
        <li><strong>Fixed / demand charge</strong> — a per-kW or per-month amount based on
          your sanctioned load, not your usage.</li>
        <li><strong>Electricity duty &amp; taxes</strong> — commonly around 5–20% on top;
          this calculator uses an 8% average duty assumption when a state's all-in rate
          isn't published.</li>
        <li><strong>Fuel adjustment</strong> — a small surcharge/rebate that tracks fuel
          costs, changed every few months.</li>
      </ul>

      <h2>Why your PC's marginal cost is the top-slab rate</h2>
      <p>
        If your household already consumes 280 units a month, every unit your PC adds is
        billed at the <em>301–500 slab</em> rate — not your bill's average ₹/kWh. A gaming PC
        used 3 h/day at ~315 W adds about 29 units a month. At a ~₹9/kWh top slab with duty,
        that's roughly {rupee(280)}/month — about {rupee(3400)}/yr, which matches what the
        {' '}<Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        will show you once your state and usage are set.
      </p>

      <h2>State tariffs differ a lot</h2>
      <p>
        The calculator ships rates for Indian states sourced from public utility/regulator
        publications (see{' '}
        <Link to="/data" className="text-brand-text underline underline-offset-2">Data freshness</Link>{' '}
        for exactly what changed when) and applies slab logic monthly, the way your
        distributor does. It auto-detects your state from your connection, and you can
        override both the state and the exact ₹/kWh from your bill — the override is the
        most accurate path, because concessions (farm, BPL, EV rates) and meter categories
        are too varied to model universally.
      </p>

      <h2>Four honest ways to spend less</h2>
      <ol>
        <li><strong>Stay under the slab boundary</strong> — if your household sits just
          above 200 or 500 units, a PC's 25–30 units can tip the whole bill into the next
          slab. Sleep modes and monitor-off timers genuinely help here.</li>
        <li><strong>Shift bulk work to off-peak</strong> — relevant mainly if you're on a
          TOU (time-of-day) tariff; large downloads, renders and AI training runs are
          schedule-flexible.</li>
        <li><strong>Efficiency-rated PSU</strong> — an 80-Plus Gold unit wastes less as
          heat; see{' '}
          <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">PSU sizing explained</Link>.</li>
        <li><strong>Right-size the machine</strong> — a 450 W-class build does 90% of what
          an 800 W-class build does for most people, at half the running cost; the{' '}
          <Link to="/suggestions" className="text-brand-text underline underline-offset-2">suggestions page</Link>{' '}
          helps you compare candidates.</li>
      </ol>

      <p className="text-xs text-gray-500">
        Slab structures and duty percentages change with regulatory orders; verify the exact
        figures with your distributor's latest tariff card. This guide is general
        information, not billing advice.
      </p>
    </>
  ),
};
