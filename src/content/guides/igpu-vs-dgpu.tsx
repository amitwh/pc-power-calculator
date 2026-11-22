/**
 * "iGPU vs dedicated GPU: what the integrated graphics actually is"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { CpuDieBlockFigure } from '@/components/guides/Figures';
import { PanelsTopLeft } from 'lucide-react';
import type { Guide } from './types';

export const igpuVsDgpu: Guide = {
  slug: 'igpu-vs-dgpu',
  title: 'iGPU vs dedicated GPU: what the integrated graphics actually is',
  description:
    'Integrated graphics share your system RAM and your CPU\'s power budget. Here is what that means for performance, for wattage, and for when a dedicated card is worth it.',
  minutes: 7,
  updated: 'November 2026',
  category: 'hardware',
  icon: PanelsTopLeft,
  tags: ['integrated graphics', 'igpu', 'apu', 'dedicated gpu', 'shared memory', 'intel arc', 'vega'],
  body: (
    <>
      <p>
        An integrated GPU is not a small graphics card. It is a graphics engine built
        into the CPU package, sharing the processor's silicon, its memory and its power
        budget. There is no separate card, no separate memory and no separate cooler —
        which is exactly where both its strengths and its limits come from.
      </p>

      <h2>How an iGPU gets its memory</h2>
      <p>
        An iGPU has no memory of its own. The CPU's <strong>memory controller</strong>{' '}
        hands it a slice of system RAM over the same bus the processor uses, and the
        display driver reserves a chunk of it up front — commonly up to half the
        installed memory — for framebuffers, textures and the things the desktop draws.
      </p>
      <p>
        The same RAM then has to serve the CPU's instructions, the operating system's
        files and the graphics at the same time. It is the same physical memory, reached
        over the same wires, which is where the two costs below come from.
      </p>

      <h2>What that costs</h2>
      <p>
        First, <strong>bandwidth is shared</strong>. While the graphics are busy, the CPU
        is competing for the same memory controller, so the machine feels slower even
        though the processor looks idle. This is why an iGPU machine can feel sluggish in
        a game while nothing in the task manager looks busy.
      </p>
      <p>
        Second, the iGPU lives inside the CPU's power budget. When the graphics engine
        works, it draws from the same envelope as the processor's cores, and the cooling
        has to cover both. Some Intel “F-series” desktop chips ship with the integrated
        graphics disabled entirely, precisely because a machine that never draws
        anything should not pay for a graphics engine it will never use.
      </p>
      <CpuDieBlockFigure />

      <h2>What it is genuinely good at</h2>
      <p>
        An iGPU is good at a surprising range of work, because none of that work is 3D:
      </p>
      <ul>
        <li>driving the display and the desktop itself — compositing windows,
          animations, video;</li>
        <li>video playback, including hardware video decode;</li>
        <li>light 3D work: a browser with hardware acceleration, a photo editor's
          canvas;</li>
        <li>older or lighter games, especially at 1080p on lower settings.</li>
      </ul>
      <p>
        For all of that the integrated engine is far quicker than software rendering and
        far cheaper than a discrete card. The{' '}
        <Link to="/guides/what-each-component-draws" className="text-brand-text underline underline-offset-2">
          guide to what each component draws
        </Link>{' '}
        has the per-part wattages.
      </p>

      <h2>When a dedicated card earns its keep</h2>
      <p>
        Anything with real 3D load, and anything doing AI.
      </p>
      <p>
        The gap is not marginal. A modern integrated GPU has a fraction of a discrete
        card's compute units, its texture units and its memory bandwidth, and the
        shortfall shows up as lower settings and lower frame rates in the same game. For
        modern titles at 1080p, an iGPU usually means turning things down.
      </p>
      <p>
        For AI it is worse than a fraction, because the constraint is a different one
        entirely. A dedicated card carries its own <strong>VRAM</strong>; an iGPU is
        borrowing RAM that the operating system also wants. The{' '}
        <Link to="/guides/vram-explained" className="text-brand-text underline underline-offset-2">
          VRAM guide
        </Link>{' '}
        explains why that is a hard limit rather than a slow one, and the{' '}
        <Link to="/guides/gpu-explained" className="text-brand-text underline underline-offset-2">
          GPU guide
        </Link>{' '}
        covers the hardware on the other side of the comparison.
      </p>

      <h2>The always-on angle, and the headline</h2>
      <p>
        This is where the choice stops being about frame rates and starts being about
        your bill, and it runs against the usual expectation. A discrete card in an
        otherwise idle machine is still drawing roughly <strong>10–30 W</strong> — the
        fans may spin, the display engine runs, the memory stays clocked. An iGPU machine
        has no such floor: when nothing is being drawn, the graphics engine goes quiet
        along with the rest of the chip.
      </p>
      <p>
        That floor is not a rounding error. Left switched on for a year, 10 W is
        10 × 24 × 365 ≈ 87,600 Wh, or about 88 kWh; at 30 W it is closer to 263 kWh. For
        an always-on machine — a file server, a home lab, a NAS — a discrete card that is
        not doing AI work is a permanent tax on power that produces nothing. It is the
        single biggest reason not to fit a graphics card to a NAS, and the{' '}
        <Link to="/guides/running-pc-24-7" className="text-brand-text underline underline-offset-2">
          guide to running a PC 24/7
        </Link>{' '}
        works through the idle-hours arithmetic behind it.
      </p>

      <p>
        Add the parts to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        and it prices the build part by part, then converts component draw to wall draw
        through the supply's efficiency curve. If you are deciding between the two, the
        shortest version is: an integrated GPU is the right answer for everything except
        3D and AI, and those are the only two things a dedicated card is genuinely for.
      </p>
    </>
  ),
};
