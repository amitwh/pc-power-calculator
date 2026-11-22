/**
 * "What local AI and LLM workloads draw from the wall"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it. The
 * body JSX below is unchanged from the original `src/pages/Guides.tsx`.
 */
import { Link } from 'react-router-dom';
import { rupee } from './format';
import { Brain } from 'lucide-react';
import type { Guide } from './types';

export const localAiPower: Guide = {
  slug: 'local-ai-power',
  title: 'What local AI and LLM workloads draw from the wall',
  description:
    'Inference vs training power, why VRAM-bound decoding is not the same as a gaming load, and what a 24/7 inference box costs.',
  minutes: 8,
  updated: 'November 2026',
  category: 'power',
  icon: Brain,
  tags: ['local ai', 'llm inference', 'gpu training', 'vram', 'ai server', 'power draw'],
  body: (
    <>
      <p>
        A local model server is a PC with an unusual duty cycle. The wattage is not
        exotic; the uptime is. The calculator has two AI profiles that make the
        difference explicit.
      </p>

      <h2>Two profiles, two duty cycles</h2>
      <ul>
        <li><strong>LLM inference</strong> — GPU at 95%, CPU at 30%, RAM at 80%, storage
          at 10%. Token generation keeps the card busy but rarely pins every SM at
          100%.</li>
        <li><strong>Model training</strong> — GPU at 99%, CPU at 40%, RAM at 70%, storage at
          20%. A training step is closer to a sustained full-card load.</li>
      </ul>
      <p>
        On the GPU the model is linear: 10% of TDP at idle, rising to full TDP at 100%
        utilisation. An RTX 4090 (450 W) is 45.0 W at idle, <strong>429.8 W</strong> at
        95% and <strong>445.9 W</strong> at 99% — 16 W between inference and training on
        the card. The rest of the system widens that a little: the full build moves from
        542.7 W to 575.6 W. The headline is that the two profiles differ far less than
        people expect once the machine is already on.
      </p>

      <h2>Why decoding is not a gaming load</h2>
      <p>
        The model does not simulate memory controllers. It scales each part from its idle
        floor to its TDP using the workload's utilisation percentage. A decode loop can
        report 95% GPU utilisation while spending much of each cycle waiting on memory, so
        the real board power often sits below the 429.8 W the model assigns. Treat that
        number as the top of the range for the profile, not a meter reading.
      </p>
      <p>
        Frame-limited games have the same issue in reverse: the game may draw less than
        the 95% GPU utilisation in the gaming profile assumes. The model's answer is only
        as good as the utilisation you give it, which is why the profiles are named rather
        than guessed.
      </p>

      <h2>What a 24/7 inference box costs</h2>
      <p>
        Reference build: Ryzen 9 7900X, RTX 4090, 64 GB DDR5-5600, 1 TB NVMe, B650
        board, 360 mm AIO, 1000 W Titanium PSU. On the inference profile around the clock, in
        Maharashtra:
      </p>
      <ul>
        <li>Wall draw: <strong>542.7 W</strong>.</li>
        <li>Energy: <strong>4,758 kWh/year</strong>.</li>
        <li>Cost: <strong>{rupee(46763)}/year</strong>, about {rupee(3897)} a month.</li>
      </ul>
      <p>
        The same build on training for 24 hours a day is 575.6 W and {rupee(50188)} a
        year — about 7% more, not double. If training is a four-hour batch and the box
        idles for the other twenty, the year is 1,568 kWh and {rupee(11286)}:
        {` ${rupee(6052)}`} for the training hours and {` ${rupee(5234)}`} for idle.
        Idle is almost as expensive as the work.
      </p>
      <p>
        That is the practical case for scheduling heavy jobs and sleeping the box between
        them. The{' '}
        <Link to="/cost/in/mh" className="text-brand-text underline underline-offset-2">Maharashtra tariff page</Link>{' '}
        shows the slab walk behind those numbers.
      </p>

      <h2>PSU headroom, even at “only” 543 W</h2>
      <p>
        The calculator sizes the PSU from peak component draw, not from the workload's
        average. This build peaks at 647 W of component draw, so the recommendation is
        <strong> 1,000 W</strong> — 647 × 1.35, rounded up to a sold size. A 650 W unit
        would be near its limit before any transient.
      </p>
      <p>
        Transients are the reason. TDP is a sustained power target; a card can burst well
        above it for milliseconds when a step loads or a kernel launches. The PSU guide
        uses a rule of thumb of roughly double rated power for a few milliseconds — an
        outside-the-model industry figure, not something the calculator computes. Extra
        capacity absorbs it. Read{' '}
        <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">PSU sizing explained</Link>{' '}
        for the full argument.
      </p>

      <h2>The cheaper box</h2>
      <p>
        A smaller box with a Ryzen 5 7600, 16 GB RTX 4060 Ti, 32 GB DDR5-5600, 1 TB
        NVMe and a Gold 550 W PSU draws <strong>216.9 W</strong> on the same 24/7
        inference profile, uses 1,901 kWh/year and costs
        <strong> {rupee(14844)}</strong> — {rupee(31919)} a year less.
      </p>
      <p>
        That is not a recommendation to buy the smaller card. VRAM capacity decides which
        models you can load at all, and the calculator does not measure tokens per second.
        What it does say is that the rent on a 24/7 box is dominated by uptime and by the
        card's idle-to-load spread, so size the GPU for the model you need and then decide
        how many hours a day it should be awake. The{' '}
        <Link to="/parts/gpu-nvidia-rtx-4090" className="text-brand-text underline underline-offset-2">RTX 4090 page</Link>{' '}
        and the{' '}
        <Link to="/parts/gpu-nvidia-rtx-4060-ti" className="text-brand-text underline underline-offset-2">RTX 4060 Ti page</Link>{' '}
        carry the per-part figures.
      </p>
    </>
  ),
};
