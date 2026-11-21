/**
 * "VRAM explained: capacity, bus width and why 8 GB is enough for games but not for AI"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { VramBandwidthFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const vramExplained: Guide = {
  slug: 'vram-explained',
  title: 'VRAM explained: capacity, bus width and why 8 GB is enough for games but not for AI',
  description:
    'GDDR6, GDDR6X and HBM explained — how capacity and bandwidth differ, what a 512-bit bus buys you, and why VRAM is the limit on local AI.',
  minutes: 7,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['vram', 'gddr6', 'gddr6x', 'memory bandwidth', 'rtx 4090', 'local llm', 'hbm'],
  body: (
    <>
      <p>
        VRAM is the graphics card's working memory, and it is where most of a modern
        card's limits actually live. A card's arithmetic can be faster than its memory,
        and when it runs out of memory to work with, the answer is not a slower frame —
        it is a failure.
      </p>

      <h2>Capacity is a hard ceiling</h2>
      <p>
        Capacity is the first thing to check and the least forgiving. A texture set that
        does not fit does not get simplified; it fails to load. A model that does not fit
        does not run slowly; it does not run.
      </p>
      <p>
        That is why “8 GB of VRAM” is a real specification limit rather than a
        preference. A modern game usually wants a couple of gigabytes for its textures
        and render targets, and the number moves with the title and with the settings you
        choose.
      </p>

      <h2>Bandwidth is the speed limit</h2>
      <p>
        Bandwidth is how fast the memory can hand data to the processors, and it falls
        out of two numbers: the width of the bus and the rate at which it moves data.
      </p>
      <p>
        <code>bandwidth (GB/s) = (bus width in bits ÷ 8) × data rate per pin</code>
      </p>
      <p>
        So a 128-bit bus running at 21 Gbps gives roughly 336 GB/s, and a 192-bit bus at
        the same rate roughly 504 GB/s — the class of card an RTX 4070 sits in. The RTX
        4090 pairs a 384-bit bus with 24 GB of GDDR6X and is rated at roughly 1,008 GB/s.
      </p>
      <VramBandwidthFigure />
      <p>
        Capacity answers “will it fit”. Bandwidth answers “how fast does it move”. A card
        that is waiting on memory is a card drawing watts without finishing frames, which
        is why a card with more bandwidth can hold a higher frame rate on the same
        settings.
      </p>

      <h2>GDDR6, GDDR6X and HBM</h2>
      <ul>
        <li><strong>GDDR6</strong> — the mainstream option, relatively cool and cheap,
          used at 16–18 Gbps on most cards.</li>
        <li><strong>GDDR6X</strong> — Micron's PAM4 encoding, which carries more bits
          per pin at the same clock. Higher data rates and noticeably more heat, which
          is why the fastest memory options need large coolers.</li>
        <li><strong>HBM</strong> — memory stacked directly on the processor and joined
          by a very wide interface. Enormous bandwidth and much less energy per bit
          moved, at several times the cost. You will not find it in a desktop card; it is
          what datacentre AI accelerators use.</li>
      </ul>
      <p>
        Memory is not free electricity, either. A wide, fast bus running at full rate is
        a meaningful share of a card's board power, and it is the reason cards fitted
        with the highest-clocked memory run hot. An idle card can drop its memory into a
        low-power state, which is part of why the idle floor is as low as it is.
      </p>

      <h2>Why games fit in 8 GB and models do not</h2>
      <p>
        A modern game is a working set of textures, meshes, render targets and audio
        buffers — a couple of gigabytes for most titles, more at high resolutions with
        high-quality texture packs.
      </p>
      <p>
        A language model is a set of weights, and the weights are large. At 4-bit
        precision, a 7-billion-parameter model needs roughly <strong>4–5 GB</strong> for
        the weights alone — before the context window, before the runtime's own overhead,
        before you have loaded anything else onto the card. On a card with 8 GB, that
        leaves very little room, which is why VRAM capacity rather than a TOPS number
        decides which models you can run locally. The{' '}
        <Link to="/guides/local-ai-power" className="text-brand-text underline underline-offset-2">
          local AI power guide
        </Link>{' '}
        makes the same point from the electricity side.
      </p>

      <h2>Shared memory is not the same thing</h2>
      <p>
        An integrated graphics engine borrows system RAM, which gives it the capacity of
        that RAM and none of the bandwidth. The memory is already being used by the
        operating system, and it is reached over the CPU's bus rather than a dedicated
        wide one. That is why an iGPU advertising 16 GB of “shared memory” is not a
        substitute for a discrete card with 16 GB of VRAM, and why the{' '}
        <Link to="/guides/igpu-vs-dgpu" className="text-brand-text underline underline-offset-2">
          iGPU guide
        </Link>{' '}
        treats them as two different categories rather than as alternatives.
      </p>

      <p>
        If you are shopping a card for local AI, the{' '}
        <Link to="/parts/gpu-nvidia-rtx-4090" className="text-brand-text underline underline-offset-2">
          RTX 4090 page
        </Link>{' '}
        and the{' '}
        <Link to="/parts/gpu-nvidia-rtx-4060-ti" className="text-brand-text underline underline-offset-2">
          RTX 4060 Ti page
        </Link>{' '}
        carry the per-part figures. Add the card to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        and it prices the build part by part and converts component draw to wall draw.
      </p>
    </>
  ),
};
