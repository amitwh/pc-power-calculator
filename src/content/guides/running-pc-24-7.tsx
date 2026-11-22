/**
 * "What it actually costs to leave a PC on 24/7"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import { rupee } from './format';
import { Timer } from 'lucide-react';
import type { Guide } from './types';

export const runningPc247: Guide = {
  slug: 'running-pc-24-7',
  title: 'What it actually costs to leave a PC on 24/7',
  description:
    'The always-on idle draw, what it costs across Indian tariff slabs, and when sleep is the better answer.',
  minutes: 8,
  updated: 'November 2026',
  category: 'power',
  icon: Timer,
  tags: ['always on', 'idle power', '24/7', 'sleep vs shutdown', 'server power', 'annual cost'],
  body: (
    <>
      <p>
        The question is not really “what does a gaming PC draw”. It is “what does the
        machine draw while nobody is using it”, because that is where the hours go. The
        calculator derives that idle figure from the parts instead of assuming one wattage
        for every desktop.
      </p>

      <h2>Where the idle number comes from</h2>
      <p>
        Each component is modelled at zero utilisation — the app scales every part from
        its idle floor up to its rated watts. For CPUs the floor is 15% of rated TDP; for
        GPUs it is 10%. A 65 W
        Ryzen 5 7600 idles at <strong>9.75 W</strong> in the model and a 165 W Radeon RX
        7600 at <strong>16.5 W</strong>. The rest of the machine adds its own floors —
        chipset, memory, storage, fans — and the PSU adds its conversion loss on top.
      </p>
      <p>
        Add them up and the reference build — Ryzen 5 7600, Radeon RX 7600, 32 GB
        DDR5-5600, 1 TB NVMe, B650 board, Wraith Stealth cooler, Gold 550 W PSU — sits at
        <strong> 44.6 W</strong> at the wall. A workstation with a Ryzen 9 7900X, RTX 4090,
        64 GB DDR5, 1 TB NVMe, B650 board, 360 mm AIO and 1000 W Titanium PSU lands at
        <strong> 99.6 W</strong>. That is close enough to 50 W and 100 W to use as round
        examples below. The CPU's own figures are on its{' '}
        <Link to="/parts/cpu-amd-ryzen-5-7600" className="text-brand-text underline underline-offset-2">Ryzen 5 7600 page</Link>.
      </p>

      <h2>A month of idle at 50 W and 100 W</h2>
      <p>
        Run the arithmetic first: 50 W × 24 h × 30.44 days = <strong>36.5 kWh</strong> a
        month; 100 W doubles that to <strong>73.1 kWh</strong>. What those units cost
        depends on where your household already sits in the slab structure. On
        Maharashtra's domestic slabs (₹5.67 / ₹9.90 / ₹11.00 per kWh plus 8% duty):
      </p>
      <ul>
        <li>Household already at 50 kWh/month: the 50 W machine adds about {rupee(224)}
          a month; the 100 W machine about {rupee(553)}, because part of its consumption
          crosses into the second slab.</li>
        <li>At 100 kWh/month: {rupee(391)} and {rupee(781)}.</li>
        <li>At 250 kWh/month: {rupee(391)} and {rupee(809)}.</li>
        <li>At 400 kWh/month: {rupee(434)} and {rupee(868)}.</li>
      </ul>
      <p>
        The pattern is the point. For a household already above 100 units, each added kWh
        is billed at ₹9.90 plus duty — <strong>₹10.69 marginal</strong>. Above 300 units
        it is ₹11.00 plus duty, or <strong>₹11.88</strong>. The marginal rate, not the
        bill's average, is what an always-on PC costs.
      </p>
      <p>
        The calculator's headline bills the build's own units through the slabs from zero,
        so 24/7 idle on the 44.6 W build reads {rupee(199)}/month (about
        {` ${rupee(2394)}`}/year) — a first-slab view. If your home is already past the
        first slab, enter your top-slab all-in rate in the manual ₹/kWh override for the
        honest marginal number. The full structure is on the{' '}
        <Link to="/cost/in/mh" className="text-brand-text underline underline-offset-2">Maharashtra tariff page</Link>.
      </p>

      <h2>The idle-hours control</h2>
      <p>
        The schedule editor has a row labelled <strong>“On but idle (desktop /
        browsing)”</strong>. That slider sets <strong>idle_hours_per_day</strong>; it
        shares the 24-hour budget with your scheduled workloads, and monitors are excluded
        from the idle row because they sleep. Take the reference build at 3 hours of 1440p
        gaming plus 21 idle hours:
      </p>
      <ul>
        <li>Gaming: 224.7 W, 246 kWh/year, {rupee(1508)}.</li>
        <li>Idle: 44.6 W, 342 kWh/year, {rupee(2095)}.</li>
        <li>Total: 588 kWh, {rupee(3602)}/year.</li>
      </ul>
      <p>
        Set the idle slider to zero — the machine sleeps when you are not using it — and
        the total falls to {rupee(1508)}. <strong>Sleeping saves {rupee(2095)} a
        year</strong>, more than the gaming itself, because the machine is on for 21 hours
        longer than it is working. The only reason to keep it awake is a job that has to
        run: downloads, a remote session, a server.
      </p>

      <h2>When 24/7 is the right answer</h2>
      <p>
        A home server is a different machine from a desktop left on. The calculator has
        three server profiles, and on the same reference build they cost:
      </p>
      <ul>
        <li><strong>Server (idle)</strong> — a NAS sitting ready: 48.3 W, 423 kWh/year, {rupee(2591)}.</li>
        <li><strong>Server (light)</strong> — Plex streaming, light VMs: 79.2 W, 694 kWh/year, {rupee(4251)}.</li>
        <li><strong>Server (heavy)</strong> — transcoding, heavy VMs: 179.6 W, 1,574 kWh/year, {rupee(11349)}.</li>
      </ul>
      <p>
        For a NAS that must always be available, {rupee(2591)} a year is the rent. At
        heavy-server money, a low-power box or a scheduled window starts to pay for
        itself. The rule is simple: 24/7 is legitimate when the service is the point, not
        when the machine is just awake.
      </p>
      <p>
        Outside India the arithmetic changes currency, not shape. The bundled California
        schedule is a flat $0.32/kWh with no separate tax line; the same 36.5 kWh month
        costs <strong>$11.69</strong>. See the{' '}
        <Link to="/cost/us/ca" className="text-brand-text underline underline-offset-2">California page</Link>{' '}
        for the full example table.
      </p>
      <p>
        To price your own idle hours, <Link to="/" className="text-brand-text underline underline-offset-2">open the calculator</Link>,
        build the machine, and move the idle slider before you touch anything else.
      </p>
    </>
  ),
};
