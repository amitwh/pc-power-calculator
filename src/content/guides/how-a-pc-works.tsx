/**
 * "What a PC is actually made of: the parts, the buses and the power"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { DataPathFigure, PowerPathFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const howAPcWorks: Guide = {
  slug: 'how-a-pc-works',
  title: 'What a PC is actually made of: the parts, the buses and the power',
  description:
    'The plain-English tour of a PC: what the CPU, GPU, memory and storage actually do, how they talk to each other, and where the watts come from.',
  minutes: 8,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['how a pc works', 'pc parts', 'bus', 'data path', 'power supply', 'beginner guide'],
  body: (
    <>
      <p>
        A PC is a box of specialised parts talking to each other over a handful of
        connections. Only two of them decide how fast it feels: the <strong>CPU</strong>,
        which decides what to do, and the <strong>GPU</strong>, which does the drawing.
        Everything else either feeds those two or keeps them alive.
      </p>

      <h2>Two paths run through every PC</h2>
      <p>
        The <strong>data path</strong> is the route information takes. It comes off a
        drive into <strong>RAM</strong>, the CPU reads it and works out what to do, the
        GPU renders the result, and the finished frame goes out to the display. The{' '}
        <strong>power path</strong> is the route energy takes, and it is much less
        interesting to look at: mains AC arrives at the socket, the{' '}
        <strong>power supply</strong> converts it to the low-voltage DC the parts need,
        and it splits into a set of rails — one for the processor, one for memory, one
        for the drives and the fans.
      </p>
      <DataPathFigure />
      <PowerPathFigure />
      <p>
        Both paths are lossy. Every stage between the socket and a component wastes a
        little energy as heat, which is why the number on your electricity meter is
        always larger than the sum of the parts. The{' '}
        <Link to="/guides/wall-power-vs-component-power" className="text-brand-text underline underline-offset-2">
          wall power versus component power guide
        </Link>{' '}
        does that conversion properly.
      </p>

      <h2>The parts, one line each</h2>
      <ul>
        <li><strong>CPU</strong> — runs the instructions. Every other part is waiting on
          it or feeding it.</li>
        <li><strong>GPU</strong> — does the parallel arithmetic for graphics, and for
          anything else that can be broken into thousands of identical pieces.</li>
        <li><strong>RAM</strong> — fast, temporary working memory. Everything the CPU
          is actively using lives here; it is lost when the machine is switched off.</li>
        <li><strong>Storage</strong> — SSD or hard disk. Long-term storage, and the
          only place your files actually live.</li>
        <li><strong>Motherboard</strong> — the board that holds the CPU, the memory
          slots and the expansion slots, and carries the chipset that ties them
          together.</li>
        <li><strong>PSU</strong> — converts mains AC into the DC rails. Its wattage
          rating is capacity, not consumption; see{' '}
          <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">
            PSU sizing explained
          </Link>
          .</li>
        <li><strong>Cooler</strong> — moves heat off the processor. A tower cooler or an
          all-in-one liquid cooler; the processor has none of its own.</li>
        <li><strong>Fans</strong> — move air through the case, and are usually the
          reason a machine is audible rather than the reason it is slow.</li>
        <li><strong>Monitor</strong> — powered from the wall, not from the PSU, so it
          sits outside the power supply's sizing but inside your bill.</li>
      </ul>

      <h2>Not every connection is the same speed</h2>
      <p>
        A <strong>bus</strong> is just a shared connection between parts, and the buses in
        a PC are not interchangeable. A PCIe 4.0 x16 slot — the one a graphics card
        usually sits in — moves roughly 31.5 GB/s in each direction once the link
        encoding is accounted for, or 63 GB/s over both directions at once. PCIe 5.0 x16
        doubles the link rate, so roughly 63 GB/s each way. A SATA port carries 6 Gb/s and
        a USB 3.2 port 10 Gb/s, which is why an NVMe drive on PCIe is so much faster than
        the same drive on SATA. The DDR memory bus is faster again: DDR5-5600 moves about
        44.8 GB/s per channel.
      </p>
      <p>
        The display link is not a separate bus in the usual sense — it usually runs
        through the PCIe fabric, or straight out of the memory system on a machine with
        integrated graphics. Whatever the route, the last leg is the monitor cable, and
        a display can only refresh as fast as it can be fed.
      </p>

      <h2>The cooling path ends in your room</h2>
      <p>
        Heat leaves a chip one way only: through its lid, into the heat spreader, into
        the cooler, into the air. A tower cooler or an AIO takes it from there into the
        case and out the back. A processor with no cooler of its own dumps it into the
        case, and the case fans carry it out.
      </p>
      <p>
        The consequence for an electricity bill is direct: <strong>every watt a component
        draws leaves the machine as heat</strong>. A 400 W build is not 400 W of useful
        work that vanishes — it is 400 W that ends up warming the room, and in summer
        that is cooling you pay for. This is the same reason a light bulb is a heater
        that happens to give off light.
      </p>

      <h2>Where the money goes</h2>
      <p>
        In a typical desktop, the CPU and the GPU together are around 70–90% of the
        machine's rated draw. Memory, storage, the motherboard, the fans and the cooler
        are the long tail — each one small, all of them together still worth knowing
        about. The per-part figures are in{' '}
        <Link to="/guides/what-each-component-draws" className="text-brand-text underline underline-offset-2">
          what each PC component actually draws
        </Link>
        .
      </p>

      <p>
        Add the parts you have to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        and it prices the build component by component, then converts component draw to
        wall draw through the supply's efficiency curve. If you would rather know what
        the machine is <em>doing</em> than what it costs, start with{' '}
        <Link to="/guides/cpu-explained" className="text-brand-text underline underline-offset-2">
          what the CPU does
        </Link>{' '}
        and work outwards.
      </p>
    </>
  ),
};
