/**
 * "What the CPU does: cores, threads, clocks and what TDP really means"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { CpuDieBlockFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const cpuExplained: Guide = {
  slug: 'cpu-explained',
  title: 'What the CPU does: cores, threads, clocks and what TDP really means',
  description:
    'Cores, threads, clock speed, IPC, boost and TDP — what each term actually describes about a processor, and which of them decides how fast your PC feels.',
  minutes: 8,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['cpu', 'processor', 'cores', 'threads', 'tdp', 'boost clock', 'ipc'],
  body: (
    <>
      <p>
        The CPU runs every instruction. The GPU draws the picture, the drive holds the
        file and the memory holds what the CPU is working on — but the decisions all come
        from the processor, and the rest of the machine is either waiting on it or feeding
        it. Which is why the terms around a processor are worth getting straight: they
        describe very different things, and they are easy to confuse.
      </p>

      <h2>What a core actually contains</h2>
      <p>
        A <strong>core</strong> is an execution unit with a fixed set of parts: an
        arithmetic logic unit for integers, a <strong>floating-point unit</strong> for
        decimals, load and store units to fetch and write data, and branch logic to
        decide which way to go next. It runs one <strong>instruction stream</strong> — one
        program's worth of instructions, in order.
      </p>
      <p>
        A desktop processor is a package of four to eight of these, plus a shared cache
        and the controllers that talk to memory and to the expansion slots.
      </p>
      <CpuDieBlockFigure />

      <h2>Two threads per core, not twice the work</h2>
      <p>
        <strong>Simultaneous multithreading</strong> gives each core two hardware
        threads. The core can keep two instruction streams moving at once, so the second
        one can use execution units the first is sitting idle waiting for.
      </p>
      <p>
        It does not double the work. It hides <strong>latency</strong>. The cost is real
        too: on some parts, running both threads gives back a few percent of
        single-thread performance — often quoted in the region of 5–15% — and it also
        costs a few watts, because more of the core is awake.
      </p>

      <h2>GHz is only half the story</h2>
      <p>
        <code>GHz</code> is cycles per second: how many times the core's clock ticks in
        a second. It is not a measure of work done. The other half is <strong>IPC</strong>{' '}
        — instructions per cycle — how many instructions the core retires for each tick
        it gets.
      </p>
      <p>
        So two chips at the same clock can behave very differently, and a chip with a
        lower clock but much higher IPC can be the faster one. That is why a modern part
        at a lower frequency often beats an older one at a higher frequency, and it is
        why single-core speed and multi-core throughput are quoted separately.
      </p>

      <h2>Base clock, boost clock and the power limits</h2>
      <p>
        The <strong>base clock</strong> is the sustained rating — the frequency the chip
        is expected to hold when all its cores are busy. The <strong>boost clock</strong>
        is the opportunistic one: a higher frequency the part tries to reach when it has
        thermal and power headroom.
      </p>
      <p>
        Both are governed by limits the manufacturer sets, and the names differ by
        vendor: Intel uses PL1 for the sustained limit and PL2 for the short-term one;
        AMD uses PPT for the package limit, with TDC for current and EDC for electrical
        design limits. They are the same idea under different names — how much energy
        the package is allowed to spend, and for how long.
      </p>
      <p>
        This is why a machine that has been running a heavy compile for ten minutes may
        benchmark lower than one that has been sitting idle. The boost window is a
        budget that gets spent.
      </p>

      <h2>TDP is a cooling target, not a measurement</h2>
      <p>
        <strong>TDP</strong> is the thermal design power — the amount of heat the
        cooler has to be able to move away, which is what the number is really for. It
        is not a measurement of what the chip draws, and both ends of the range are
        reachable:
      </p>
      <ul>
        <li>a chip rated at 65 W can sit at a few tens of watts when idle, and can draw
          well over 100 W during a boost window;</li>
        <li>a chip rated at 125 W can sit at 40 W doing light work, if the workload
          never needs the extra cores.</li>
      </ul>
      <p>
        The calculator treats rated draw as the number it scales between idle and load,
        which is why the processor's rated watts are what its row in the component table
        shows, and what the power supply recommendation is built from.
      </p>

      <h2>x86-64 and ARM</h2>
      <p>
        Most desktops run <strong>x86-64</strong>: the instruction set Intel and AMD have
        both shipped for decades, and the reason one Windows licence and one game work
        on both. <strong>ARM</strong> is a different instruction set, built for efficiency
        rather than for a long tail of backwards compatibility — Apple's silicon Macs and
        Qualcomm's Snapdragon X laptops are the two that matter to a buyer.
      </p>
      <p>
        The practical difference for a desktop is power. ARM designs generally do more
        work per watt, which is why a thin-and-light laptop can be faster in practice
        than a thicker x86 machine of similar nominal performance. For a tower that
        lives plugged into the wall, the argument matters much less, because the wall
        does not care what the instruction set is.
      </p>

      <p>
        A processor's watts come from <code>voltage × current</code>, and the boost
        window is where a chip rated at 65 W becomes a 100 W chip for a minute. To see
        the numbers for a particular part, they are on its page — the{' '}
        <Link to="/parts/cpu-amd-ryzen-5-7600" className="text-brand-text underline underline-offset-2">
          Ryzen 5 7600
        </Link>{' '}
        is a good place to start — and the{' '}
        <Link to="/guides/cpu-caches" className="text-brand-text underline underline-offset-2">
          cache guide
        </Link>{' '}
        covers the memory side of the story.
      </p>
    </>
  ),
};
