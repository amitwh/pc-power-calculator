/**
 * "Wall power vs component power: why your meter reads higher"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import { PowerPathFigure } from '@/components/guides/Figures';
import { PlugZap } from 'lucide-react';
import type { Guide } from './types';

export const wallPowerVsComponentPower: Guide = {
  slug: 'wall-power-vs-component-power',
  title: 'Wall power vs component power: why your meter reads higher',
  description:
    'The calculator works in two currencies — watts at the component and watts at the socket. Here is the conversion, and why a 200 W load can show 230 W on a smart plug.',
  minutes: 5,
  updated: 'November 2026',
  category: 'power',
  icon: PlugZap,
  tags: ['wall power', 'component power', 'psu efficiency', 'power supply', 'smart plug', 'heat loss'],
  body: (
    <>
      <p>
        Every number on this site starts as <strong>component draw</strong>: the watts a
        CPU, GPU, drive or fan uses inside the case. What your electricity bill charges
        for is <strong>wall draw</strong>, which is that figure divided by how efficiently
        the power supply converts mains AC into the low-voltage DC the parts need. A PSU
        is not a magic pipe; it loses part of what it takes in as heat.
      </p>
      <p>
        <code>P_wall = P_components ÷ efficiency</code>
      </p>
      <PowerPathFigure />
      <h2>An example that looks wrong until it doesn't</h2>
      <p>
        Components drawing 200 W through a supply running at 90% efficiency pull
        <strong> 222 W</strong> from the socket. The extra 22 W never reaches a component —
        it warms your room. This is why the same PC can read 180 W on one PSU and 210 W on
        another with identical parts.
      </p>
      <h2>Efficiency is not one number</h2>
      <p>
        It depends on the load. An 80 PLUS Gold unit is typically most efficient around
        50% of its rated capacity — perhaps 90–91% — and worse at 10% (~85%) and at 100%
        (~87%). That matters for a home server idling most of the day: it spends its life
        in the least efficient part of its own curve. This calculator models that curve
        rather than assuming a flat 90%.
      </p>
      <h2>What a meter measures that we cannot</h2>
      <ul>
        <li><strong>Other devices on the strip</strong> — monitors, speakers, a dock.</li>
        <li><strong>Transient spikes</strong> — a GPU can exceed its rated draw for
          milliseconds; a meter averages them away.</li>
        <li><strong>Battery charging</strong> — a laptop or UPS charging is a load the
          model does not see.</li>
      </ul>
      <p>
        If you have taken a smart-plug reading, enter it under{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">How accurate is this?</Link>{' '}
        and the page will show the gap reading by reading rather than hiding it.
      </p>
    </>
  ),
};
