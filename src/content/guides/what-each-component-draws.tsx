/**
 * "What each PC component actually draws"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import { LoadCurveFigure } from '@/components/guides/Figures';
import { BarChart3 } from 'lucide-react';
import type { Guide } from './types';

export const whatEachComponentDraws: Guide = {
  slug: 'what-each-component-draws',
  title: 'What each PC component actually draws',
  description:
    'A plain guide to the power profile of every part in a build — CPU, GPU, RAM, storage, motherboard, fans, monitors and the PSU — and which ones dominate the bill.',
  minutes: 7,
  updated: 'November 2026',
  category: 'power',
  icon: BarChart3,
  tags: ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'fans', 'monitor'],
  body: (
    <>
      <p>
        A PC has one or two big consumers and a long tail of small ones. Knowing which is
        which tells you where to spend money to save money — and where not to bother.
      </p>
      <h2>The CPU</h2>
      <p>
        Rated by TDP (thermal design power), which is a cooling requirement, not a
        measurement. A 120 W CPU at idle uses a few watts; at full load it approaches its
        rated figure and can exceed it on boost. Modern designs also have a short
        “boost window” well above TDP, which is why a 65 W part can show 100 W briefly.
      </p>
      <h2>The GPU — usually the whole bill</h2>
      <p>
        A discrete card is often half the machine's draw under load and the single largest
        difference between two builds. Idle is low (10–20 W, though older cards idle
        poorly), gaming is near the rated board power, and rendering or training pins it.
        If one part decides your running cost, it is this one.
      </p>
      <LoadCurveFigure />
      <h2>RAM, storage and motherboard</h2>
      <p>
        Small and predictable: a DDR5 stick is around 3–6 W, an NVMe drive 5–9 W under
        load, a hard disk ~5 W idle and ~9 W spinning up, and a motherboard 15–40 W once
        chipsets and VRMs are included. The exception is a machine with many drives — ten
        HDDs is 50 W idle, which is a permanent tax on an always-on server.
      </p>
      <h2>Fans, coolers and lighting</h2>
      <p>
        A case fan is about 2 W; a tower cooler's fans and a pump together are 5–10 W; LED
        strips can be 10–20 W if you leave them on. Individually trivial, not always
        trivial in aggregate.
      </p>
      <h2>The monitor</h2>
      <p>
        A 24–27" LCD is typically 20–40 W, and it is powered from the wall rather than from
        the PSU. It sits outside PSU sizing but inside your bill. OLED panels are higher.
      </p>
      <h2>The PSU is not a consumer</h2>
      <p>
        A 650 W supply does not draw 650 W. It draws what the components demand, divided
        by its efficiency. Its rating is capacity, not consumption — a distinction that
        most simple calculators skip, and the reason a PSU appears with no wattage of its
        own in our component table.
      </p>
      <p>
        To see the split for your own build, add the parts in the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        — the breakdown chart shows each part's share of the total.
      </p>
    </>
  ),
};
