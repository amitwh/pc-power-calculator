/**
 * "Frame caps, undervolting and sleep: what actually cuts your bill"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import { rupee } from './format';
import type { Guide } from './types';

export const cuttingPcPower: Guide = {
  slug: 'cutting-pc-power',
  title: 'Frame caps, undervolting and sleep: what actually cuts your bill',
  description:
    'The three changes that move the number most, ranked, with what each is worth on an Indian tariff.',
  minutes: 7,
  updated: 'November 2026',
  category: 'power',
  tags: ['sleep mode', 'undervolting', 'frame cap', 'reduce power', 'electricity bill', 'idle draw'],
  body: (
    <>
      <p>
        Three changes do most of the work, and the largest one happens when you are not
        using the machine. All the figures below come from the same reference build:
        Ryzen 5 7600, Radeon RX 7600, 32 GB DDR5, 1 TB NVMe, Wraith Stealth cooler,
        Gold 550 W PSU, 3 hours of 1440p gaming a day and 21 idle hours. On
        Maharashtra's slabs it costs
        {` ${rupee(3602)}`} a year before any of them.
      </p>

      <h2>1. Sleep: {rupee(2095)} a year</h2>
      <p>
        The idle row is 44.6 W for 21 hours a day — 342 kWh a year, {rupee(2095)}. The
        gaming row is 224.7 W for 3 hours — 246 kWh, {rupee(1508)}. The machine spends
        most of its life doing nothing and most of its bill proving it: idle is 58% of the
        total.
      </p>
      <p>
        Set the idle-hours slider to zero and the year falls to {rupee(1508)}. Sleeping
        saves <strong>{rupee(2095)}</strong> — almost seven times the {rupee(310)} a 15%
        undervolt is worth, and more than seven times the {rupee(275)} from a mild frame
        cap. The model treats a sleeping machine as zero watts; a real PSU still
        draws a watt or two in standby, which is inside the noise of this estimate.
        Monitors are already excluded from the idle row because they sleep.
      </p>
      <p>
        The exception is a machine with a job: downloads, remote access, a NAS. That case
        is covered in{' '}
        <Link to="/guides/running-pc-24-7" className="text-brand-text underline underline-offset-2">what it actually costs to leave a PC on 24/7</Link>.
      </p>

      <h2>2. Undervolting: {rupee(310)} a year at 15%</h2>
      <p>
        The calculator does not model voltage/frequency curves. It gives you a TDP
        override instead: the <strong>“Rated watts per unit”</strong> box next to each
        part. Enter the wattage you actually observe and the model uses it everywhere —
        idle floor included, because the floor is a fraction of TDP.
      </p>
      <p>
        Take 15% off the RX 7600's 165 W, to 140 W. The gaming row falls from 224.7 W at
        the wall to <strong>198.6 W</strong>; gaming costs {rupee(1333)} instead of
        {` ${rupee(1508)}`}, and the year falls from {rupee(3602)} to {rupee(3292)}.
        A 20% cut to 132 W gets the gaming row to 189.9 W and the year to {rupee(3189)},
        saving {rupee(413)}.
      </p>
      <p>
        Typical undervolting results land in the 5–15% power-reduction range at the same
        clock — a range from outside the model, not a guarantee for your card. Too
        aggressive a curve crashes games, and stability is the constraint that matters
        more than the last few watts.
      </p>

      <h2>3. Frame caps: {rupee(275)} a year at a mild cap</h2>
      <p>
        The GPU model is a straight line from idle to TDP: idle + (TDP − idle) ×
        utilisation. For the RX 7600 that is 16.5 W at idle, 157.6 W at 95% and 90.8 W at
        50%. A frame cap lowers the utilisation the model sees, so cap from 95% to 70% and
        the gaming row falls from 224.7 W to <strong>183.7 W</strong>: {rupee(1233)} for
        the gaming hours and {rupee(3327)} for the year, a saving of {rupee(275)}.
      </p>
      <p>
        Cap harder, to 50%, and the gaming row is 150.8 W, the year {rupee(3106)}, and the
        saving {rupee(496)}. The shape is worth remembering: GPU component draw drops 42%
        between 95% and 50% utilisation, but system wall draw and cost drop by about a
        third (224.7 → 150.8 W, {rupee(1508)} → {rupee(1012)}), because the idle floor and
        the rest of the machine do not move.
      </p>
      <p>
        A cap only saves power if the GPU was working harder than the frame rate needed.
        In a CPU-bound game it does nothing. The model cannot inspect your game; the
        utilisation comes from the workload profile, which is why the{' '}
        <Link to="/parts/gpu-amd-rx-7600" className="text-brand-text underline underline-offset-2">Radeon RX 7600 page</Link>{' '}
        shows the part's modelled idle and full-load figures rather than a game-specific
        one.
      </p>

      <h2>What none of this changes</h2>
      <p>
        The hardware is already paid for. Sleep, undervolting and frame caps change the
        running cost only; they do not make the card cheaper, and they do not improve
        performance. On this build the ranking is {rupee(2095)} for sleep,
        {` ${rupee(310)}`} for a 15% undervolt and {rupee(275)} for a mild frame cap. The
        two in-game changes stack with each other and with sleep: the cap lowers the
        utilisation, the undervolt lowers the TDP that utilisation scales toward, and
        sleep removes the idle hours entirely.
      </p>
      <p>
        These are model estimates, not meter readings. Your PSU's efficiency curve,
        monitor brightness and actual frame pacing move them. To price your build,{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">open the calculator</Link>{' '}
        and use the{' '}
        <Link to="/cost/in/mh" className="text-brand-text underline underline-offset-2">Maharashtra tariff page</Link>{' '}
        to check the slab walk.
      </p>
    </>
  ),
};
