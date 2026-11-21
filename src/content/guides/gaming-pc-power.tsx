/**
 * "How much power does a gaming PC actually use?"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import { rupee } from './format';
import type { Guide } from './types';

export const gamingPcPower: Guide = {
  slug: 'gaming-pc-power',
  title: 'How much power does a gaming PC actually use?',
  description:
    'Realistic idle, gaming and peak wattage figures by build tier — and what they cost per year on an Indian electricity tariff.',
  minutes: 6,
  updated: 'November 2026',
  category: 'power',
  tags: ['gaming pc', 'power draw', 'electricity cost', 'wattage', 'idle draw', 'annual cost'],
  body: (
    <>
      <p>
        Ask five forums “how much power does a gaming PC use” and you'll get five answers,
        because people confuse three very different numbers: the <strong>PSU's rated
        wattage</strong>, the build's theoretical <strong>peak draw</strong>, and what it
        actually pulls from the wall while <em>you</em> use it. Only the third one shows up on
        your electricity bill.
      </p>

      <h2>The three numbers that matter</h2>
      <ul>
        <li><strong>Peak draw</strong> — every component running flat-out at once. A mid-range
          build (Ryzen 5 / Core i5 + RTX 4060-class GPU) peaks around 300–400 W; a high-end rig
          (Ryzen 7 X3D / Core i7 K + RTX 4070 Ti–4080 class) around 450–600 W; halo builds
          (i9 / 14900K-class + RTX 4090) can touch 700–800 W.</li>
        <li><strong>Typical gaming draw</strong> — the honest number. GPUs and CPUs rarely hit
          100% simultaneously in games; real-world gaming usually lands at 50–75% of peak.
          This calculator models it as 70% of rated draw.</li>
        <li><strong>Idle / desktop draw</strong> — browsing, office work, video playback.
          A modern desktop idles at 40–80 W at the wall; a laptop, 5–15 W.</li>
      </ul>

      <h2>What that costs per year (India)</h2>
      <p>
        Take a popular mid-range build peaking at ~450 W, drawing ~315 W while gaming, played
        3 hours a day, at a typical ₹8.41/kWh all-in tariff:
      </p>
      <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-8 my-2">{`0.315 kW × 3 h × 365 days ≈ 345 kWh/yr ≈ ${rupee(2900)}/yr`}</pre>
      <p>
        Add 5 hours a day of light desktop use at ~60 W and the total lands near
        455 kWh/yr — roughly {rupee(3800)} a year. <strong>The game time, not the hardware,
        dominates the bill</strong>: a 100 W bigger GPU used 3 h/day adds about
        {` ${rupee(920)}`} a year, but leaving the machine on 24×7 at idle adds more than
        {` ${rupee(2600)}`}. Sleep modes matter more than most upgrades.
      </p>

      <h2>Three habits that actually cut the bill</h2>
      <ol>
        <li><strong>Enable sleep / hibernate</strong> — an idle gaming PC wastes 50–70 W
          around the clock if left on; that's ~{rupee(3000)}/yr for nothing.</li>
        <li><strong>Cap frames or undervolt</strong> — dropping 144 fps caps or a small
          undervolt cuts GPU draw 10–20% with negligible visual loss.</li>
        <li><strong>Right-size the PSU</strong> — PSUs are most efficient at ~50% load;
          a sensibly sized unit (see our{' '}
          <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">PSU sizing guide</Link>)
          trims 10–30 W at the wall versus an oversized or bargain-bin one.</li>
      </ol>

      <p>
        Want your own numbers? Build your rig in the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>,
        set your usage hours, and it applies your state's tariff — including slab tiers —
        automatically. The methodology is documented in{' '}
        <Link to="/about" className="text-brand-text underline underline-offset-2">About &amp; methodology</Link>.
      </p>
    </>
  ),
};
