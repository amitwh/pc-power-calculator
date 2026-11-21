/**
 * "RAM explained: DDR4 vs DDR5, channels, timings and what actually makes it faster"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { RamChannelFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const ramExplained: Guide = {
  slug: 'ram-explained',
  title: 'RAM explained: DDR4 vs DDR5, channels, timings and what actually makes it faster',
  description:
    'What DDR5 changed, why two sticks in the right slots are faster than four, and how to read a memory kit\'s speed and latency numbers.',
  minutes: 7,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['ram', 'ddr5', 'ddr4', 'dual channel', 'cas latency', 'xmp', 'expo', 'memory timings'],
  body: (
    <>
      <p>
        RAM is the desk the processor works on. Its capacity decides whether the work
        fits on the desk at all; its speed decides how quickly the work gets handed over.
        People look at the first number and ignore the second, and the second is where
        the interesting differences are.
      </p>

      <h2>What DDR5 changed</h2>
      <p>
        DDR4 tops out at 3200 MT/s in practice. DDR5 starts at 4800 MT/s, and the common
        speed people run is 5600–6000, with 6400 and above for those who tune their own
        timings.
      </p>
      <p>
        Three structural changes matter more than the headline speed:
      </p>
      <ul>
        <li><strong>Two sub-channels per module</strong> — DDR5 splits each module into
          two independent sub-channels, each on its own data lines, which is why a single
          DDR5 DIMM can beat a single DDR4 stick on bandwidth.</li>
        <li><strong>Power management on the module</strong> — the voltage regulation
          moved onto the DIMM itself, so the motherboard no longer drives the memory
          rail as hard.</li>
        <li><strong>On-die ECC</strong> — the module corrects its own bit errors
          internally. It is not the ECC your server memory uses, but it does make the
          memory more reliable.</li>
      </ul>

      <h2>Two sticks in the right slots beat four sticks anywhere</h2>
      <p>
        <strong>Channels</strong> are the parallel paths between the memory controller and
        the modules. One stick fills one channel; a second stick in the right slot fills
        a second one, and the two work at once.
      </p>
      <ul>
        <li>one DDR5-6000 channel: about 48 GB/s;</li>
        <li>two channels: about 96 GB/s;</li>
        <li>a DDR5-5600 kit: about 44.8 GB/s per channel.</li>
      </ul>
      <RamChannelFigure />
      <p>
        The rule is simple and almost everyone gets it wrong: the two sticks go in the
        pair the board manual names — usually the slots marked A1 and B1 — rather than
        an arbitrary pair. Filling all four slots gives the controller more paths to
        manage, and in a game you will usually see no gain at all while the system
        becomes harder to keep stable. Two sticks in the right slots is the sweet spot
        for almost every build.
      </p>

      <h2>Timings, and how to read them</h2>
      <p>
        A kit's speed is the number on the front of the box; the timings are the fine
        print, and they are usually the better guide to how the kit will actually feel.
      </p>
      <p>
        <strong>CAS latency (CL)</strong> is how many clock cycles the memory waits
        before it hands over a column. Lower is better. To compare kits properly, convert
        it to nanoseconds:
      </p>
      <p>
        <code>latency (ns) = (CL ÷ transfer rate in MT/s) × 2000</code>
      </p>
      <p>
        That makes two very different kits look identical:
      </p>
      <ul>
        <li>DDR5-6000 CL30 → (30 ÷ 6000) × 2000 = 10 ns;</li>
        <li>DDR4-3200 CL16 → (16 ÷ 3200) × 2000 = 10 ns.</li>
      </ul>
      <p>
        So a DDR5-6000 kit and a DDR4-3200 kit have the same real latency, and the DDR5
        one moves twice the data.
      </p>
      <p>
        <strong>XMP</strong> and <strong>EXPO</strong> are overclocking profiles stored
        on the kit itself. If the board's BIOS runs them, the memory reaches the rated
        speed; if it does not, the kit falls back to the JEDEC default — 4800 MT/s for a
        DDR5 module — which is a long way below the 6000 on the box. The memory you
        bought and the memory you are running are not always the same thing, so check
        the BIOS after the first boot.
      </p>

      <h2>Capacity: 16 GB is the floor, 32 GB is comfortable</h2>
      <p>
        16 GB is the practical minimum in 2026. It runs the operating system and a
        browser, and it is about the point where a modern game plus a browser plus a
        voice call starts to push. 32 GB is the comfortable gaming configuration, and
        more is worth having for video editing, virtual machines or running models
        locally.
      </p>
      <p>
        Remember that the operating system is using several gigabytes of that before you
        open anything. The{' '}
        <Link to="/guides/how-a-pc-works" className="text-brand-text underline underline-offset-2">
          guide to how a PC works
        </Link>{' '}
        covers where memory sits in the data path, and the{' '}
        <Link to="/guides/cpu-caches" className="text-brand-text underline underline-offset-2">
          cache guide
        </Link>{' '}
        explains the layer between the processor and the RAM.
      </p>

      <h2>The power is small, and it never stops</h2>
      <p>
        A DDR5 module is roughly <strong>3–6 W</strong>, depending on the kit, and it
        draws that whether or not anything is using it. Four sticks of fast memory on a
        full board is a real slice of the idle draw, and “the PC is idle” in the sense of
        a machine that is on, awake and waiting for work is not the same as “the PC is
        asleep”.
      </p>
      <p>
        So if the goal is for the machine to cost nothing while it waits, the lever is
        not faster memory — it is letting the machine sleep. The{' '}
        <Link to="/guides/running-pc-24-7" className="text-brand-text underline underline-offset-2">
          guide to running a PC 24/7
        </Link>{' '}
        covers the difference between idle and asleep, and the{' '}
        <Link to="/guides/what-each-component-draws" className="text-brand-text underline underline-offset-2">
          guide to what each component draws
        </Link>{' '}
        has the per-part wattages.
      </p>

      <p>
        Add the memory to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        and it prices the build part by part, then converts component draw to wall draw
        through the supply's efficiency curve. If you are still working out what the
        machine should be made of, the{' '}
        <Link to="/guides/vram-explained" className="text-brand-text underline underline-offset-2">
          VRAM guide
        </Link>{' '}
        covers the other kind of memory in the build — the one on the graphics card.
      </p>
    </>
  ),
};
