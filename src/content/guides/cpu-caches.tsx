/**
 * "CPU cache explained: L1, L2, L3 and why cache size is a real upgrade"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { CacheHierarchyFigure } from '@/components/guides/Figures';
import { Layers } from 'lucide-react';
import type { Guide } from './types';

export const cpuCaches: Guide = {
  slug: 'cpu-caches',
  title: 'CPU cache explained: L1, L2, L3 and why cache size is a real upgrade',
  description:
    'What L1, L2 and L3 cache actually are, how much faster they are than RAM, and which workloads notice when you add more of them.',
  minutes: 7,
  updated: 'November 2026',
  category: 'hardware',
  icon: Layers,
  tags: ['cpu cache', 'l1 cache', 'l2 cache', 'l3 cache', 'ram latency', 'gaming'],
  body: (
    <>
      <p>
        A modern CPU core can retire several instructions per cycle at a clock of several
        gigahertz, but main memory answers a request tens of nanoseconds later. The gap
        between the two is far too big to sit idle through, so the processor keeps a copy
        of the data it is most likely to need in <strong>cache</strong> — small,
        extremely fast memory built onto the same die.
      </p>

      <h2>The four levels</h2>
      <p>
        Cache comes in a hierarchy, and each level is bigger and slower than the one
        above it. The sizes and latencies below are typical of a current desktop part.
      </p>
      <CacheHierarchyFigure />
      <ul>
        <li><strong>L1</strong> — 32–64 KB per core, split into an instruction cache and
          a data cache, around 1 ns. It holds the current instruction and the handful of
          values being worked on.</li>
        <li><strong>L2</strong> — roughly 0.5–2 MB per core, around 4–15 ns. Bigger, and
          still private to one core. This is usually where a core's working data sits.</li>
        <li><strong>L3</strong> — 8–64 MB shared by every core on the package, around
          15–50 ns. It is the last stop before memory.</li>
        <li><strong>DRAM</strong> — the actual RAM in your machine, measured in
          gigabytes, around 60–100 ns.</li>
      </ul>

      <h2>What a miss costs</h2>
      <p>
        A <strong>cache hit</strong> is when the data is already there and the core
        carries straight on. A <strong>miss</strong> is when it is not, and the core has
        to wait for the request to travel down the hierarchy and back. A miss does not
        cost one DRAM round trip, because the data may have to come from L3 on the way,
        then from DRAM, and then be written back up again — with the core stalled behind
        it the whole time.
      </p>
      <p>
        This is why the numbers look small but are not. At a 5 GHz clock a cycle is
        0.2 ns, so a 60 ns trip to DRAM is roughly three hundred cycles of a core doing
        nothing at all.
      </p>
      <p>
        A miss is interesting for an electricity bill, because it is a wait rather than a
        computation. The core is not doing extra work — it is idle, at whatever frequency
        the package has settled at. Cache-heavy workloads are often efficient per
        instruction for exactly that reason, but a stalled core still holds its power
        budget, so the watts do not fall when the work gets hard.
      </p>

      <h2>Where you actually feel it</h2>
      <p>
        Two kinds of workload notice the cache more than others.
      </p>
      <ul>
        <li><strong>Latency-bound games</strong> — a frame's work is a chain of small
          dependent steps, so every miss shows up directly as a frame-time spike. At
          high refresh rates, where the budget for the whole frame is only a few
          milliseconds, this is where cache latency shows up.</li>
        <li><strong>Large working sets</strong> — a 3D scene, a video project, a language
          model — that does not fit in L3 spills into DRAM. Past that point the CPU
          spends its time waiting for memory rather than computing.</li>
      </ul>
      <p>
        A local language model is the clearest case: the weights are read over and over,
        and once they no longer fit in cache every token costs a stream of memory
        reads. The{' '}
        <Link to="/guides/local-ai-power" className="text-brand-text underline underline-offset-2">
          local AI guide
        </Link>{' '}
        covers what that workload does to the bill.
      </p>

      <h2>What you can do about it</h2>
      <p>
        Not much directly, because cache is soldered onto the die. You choose the
        processor, and cache capacity is one of the reasons a bigger chip costs more: a
        core with a large private L2, and a package with a large shared L3, take more
        silicon, and bigger dies cost more to make.
      </p>
      <p>
        The practical advice is to buy for your workload. Extra L3 helps most in heavily
        threaded work, where several cores share one pool. It helps less in
        single-threaded software, where the private L2 is what matters. And if the game
        is waiting on the graphics card rather than on the processor, none of this is
        the bottleneck — the{' '}
        <Link to="/guides/gaming-pc-power" className="text-brand-text underline underline-offset-2">
          gaming power guide
        </Link>{' '}
        covers that side.
      </p>

      <p>
        To see how much of the machine's draw the processor accounts for, compare it
        against the rest of the build in the{' '}
        <Link to="/guides/what-each-component-draws" className="text-brand-text underline underline-offset-2">
          component draw guide
        </Link>
        , and price the result with the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>
        . For what the processor is actually doing, read{' '}
        <Link to="/guides/cpu-explained" className="text-brand-text underline underline-offset-2">
          what the CPU does
        </Link>{' '}
        first.
      </p>
    </>
  ),
};
