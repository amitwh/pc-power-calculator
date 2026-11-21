/**
 * "How a residential electricity tariff is actually calculated"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import { TariffSlabFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const howElectricityTariffsWork: Guide = {
  slug: 'how-electricity-tariffs-work',
  title: 'How a residential electricity tariff is actually calculated',
  description:
    'Slabs, fixed charges, duty, and the difference between the average rate on your bill and the marginal rate your PC actually pays.',
  minutes: 6,
  updated: 'November 2026',
  category: 'billing',
  tags: ['tariff slabs', 'marginal rate', 'electricity duty', 'fixed charge', 'electricity bill', 'how billing works'],
  body: (
    <>
      <p>
        A bill is not “units × rate”. It is slabs plus a fixed charge plus taxes, and the
        order matters. Getting this wrong makes a PC look cheaper to run than it is.
      </p>
      <h2>Tiered slabs</h2>
      <p>
        Most Indian states price units in steps: the first 100 units at one rate, the next
        200 at a higher one, everything above at a higher one still. The rate you pay for
        <em> the next</em> unit is the <strong>marginal rate</strong>. Adding a PC does not
        pay the average of all your units — it pays the top slab you land in, every hour it
        runs.
      </p>
      <TariffSlabFigure />
      <h2>The fixed charge</h2>
      <p>
        A monthly amount that does not move with consumption (meter rental and the
        licensee's fixed costs). It is why a zero-unit month is never a zero-rupee bill,
        and why adding a PC does not change it.
      </p>
      <h2>Duty and other add-ons</h2>
      <p>
        Electricity duty is a state tax charged as a percentage of the energy charge —
        8% is common, some states are higher. Some tariffs add a fuel surcharge or a
        wheeling charge. These apply to the units you add, so the effective rate for a new
        load is the slab rate plus duty.
      </p>
      <h2>Average vs marginal, with numbers</h2>
      <p>
        Suppose your home already uses 250 units a month in Maharashtra. The next 50 units
        are billed in the 100–300 slab, and a PC that adds 40 units does not push your
        whole bill into a higher band — it only prices those 40 units at the slab you have
        reached, plus duty. That is why “my bill went up by ₹400, so the PC costs ₹400” is
        only right if nothing else changed.
      </p>
      <p>
        The calculator walks the slabs properly and applies the taxes the bundled schedule
        declares. Check the walk state by state on the{' '}
        <Link to="/cost/in/mh" className="text-brand-text underline underline-offset-2">cost pages</Link>,
        and override the rate with your own bill's figure if you want an exact match.
      </p>
    </>
  ),
};
