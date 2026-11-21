/**
 * "Motherboard explained: sockets, chipsets, VRMs and what the board decides for you"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { MotherboardLayoutFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const motherboardExplained: Guide = {
  slug: 'motherboard-explained',
  title: 'Motherboard explained: sockets, chipsets, VRMs and what the board decides for you',
  description:
    'The socket, the chipset, the VRM and the form factor — how a motherboard decides which slots work, which lanes are available, and whether your CPU is limited.',
  minutes: 8,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['motherboard', 'socket', 'chipset', 'vrm', 'atx', 'micro atx', 'mini itx'],
  body: (
    <>
      <p>
        The motherboard is the wiring diagram for the whole machine. It decides which slots
        exist, which lanes the CPU has to share between them, and whether the processor gets
        the clean power it needs to stay at full speed. Two boards built around the same
        chipset can behave completely differently, because what matters is what each of them
        does with the lanes it was given.
      </p>
      <MotherboardLayoutFigure />

      <h2>The socket: the contract with the CPU</h2>
      <p>
        The socket is the mechanical and electrical agreement between the processor and the
        board, and it carries three quite different things at once: the power the CPU needs,
        the signal lines for the memory bus, and the point-to-point links that run to the
        graphics slot and the first M.2.
      </p>
      <p>
        Socket names are generational. Intel's <code>LGA1700</code> and <code>LGA1851</code>{' '}
        and AMD's <code>AM5</code> look similar and none of them is interchangeable with
        another — a CPU physically fits only into the socket it was designed for, and even
        where the shape matches, the pin arrangement and the power delivery do not. The
        socket name also tells you very little about the rest of the board: the same socket
        appears on boards with quite different chipsets.
      </p>

      <h2>The chipset: the traffic controller</h2>
      <p>
        The chipset is the part of the board that is not the CPU. It handles the PCIe slots
        that the CPU does not feed itself, the SATA ports, the USB controllers, the audio
        and the networking.
      </p>
      <p>
        On a modern processor the <strong>memory controller</strong> and the first PCIe lanes
        live on the CPU itself, so the CPU talks to the DIMMs and to the top graphics slot
        directly, at full speed and without a hop through a controller. The chipset picks up
        everything below that — which is why, on many boards, the first M.2 is fed by the CPU
        and the second one by the chipset, and why adding the second drive sometimes costs
        the graphics slot half its lanes. The{' '}
        <Link to="/guides/pcie-and-m2" className="text-brand-text underline underline-offset-2">
          PCIe and M.2 guide
        </Link>{' '}
        has the lane arithmetic.
      </p>

      <h2>The VRM: turning 12 V into what the core needs</h2>
      <p>
        The <strong>VRM</strong> — voltage regulator module — is the cluster of MOSFETs,
        inductors and controllers around the socket that does the actual power conversion. It
        takes the 12 V arriving on the CPU power connector and turns it into the voltages the
        silicon actually wants: under a volt for the core itself, and separate rails for the
        memory and the other dies on the package.
      </p>
      <p>
        Two things about a VRM decide how hard you can push a CPU: the <strong>phase
        count</strong> — how many groups of MOSFETs share the work — and the size of the
        heatsink sitting on top of them. More phases and a bigger sink means the current can
        be delivered without the MOSFETs getting hot enough to be throttled.
      </p>
      <p>
        This is the part worth understanding for an electricity guide, because the failure
        mode is not a crash. A board that cannot deliver the CPU's power cleanly will not
        shut the machine down; it will quietly hold the processor back, run it at a lower
        clock and draw slightly less. You lose performance, not stability, and nothing in the
        BIOS tells you why.
      </p>

      <h2>Form factors: how big the board is</h2>
      <p>
        Three sizes cover almost every desktop:
      </p>
      <ul>
        <li><strong>ATX</strong> — 305 × 244 mm. The full-size default, with room for a long
          graphics card, several expansion slots and most of the connectors you will ever
          want.</li>
        <li><strong>Micro-ATX</strong> — 244 × 244 mm. The same height, less width, and
          usually two or three expansion slots instead of seven.</li>
        <li><strong>Mini-ITX</strong> — 170 × 170 mm. One graphics slot, two memory slots
          and usually a single M.2.</li>
      </ul>
      <p>
        A smaller board is not a weaker board. It is a board with fewer slots, and a
        well-chosen Mini-ITX build gives up expandability and very little else — it often
        gives up the second M.2, the extra SATA ports and the room for a big air cooler,
        and nothing that shows up in a frame rate.
      </p>

      <h2>BIOS and UEFI: the settings worth knowing</h2>
      <p>
        The <strong>BIOS</strong> — or <strong>UEFI</strong>, which is what everything ships
        with now — is the firmware on the board itself. Most people never open it, and most
        people do not need to, with a few exceptions:
      </p>
      <ul>
        <li><strong>XMP and EXPO</strong> — the memory profiles printed on the RAM kit.
          Without them the memory runs at the JEDEC default instead of the speed on the box.
          The{' '}
          <Link to="/guides/ram-explained" className="text-brand-text underline underline-offset-2">
            RAM guide
          </Link>{' '}
          covers what the numbers mean.</li>
        <li><strong>Resizable BAR</strong> — lets the processor address the graphics card's
          whole memory rather than a small window of it. It helps some games a little and
          costs nothing to leave on.</li>
        <li><strong>Fan curves</strong> — the mapping from temperature to fan speed. This is
          the setting that decides whether the machine is quiet or cool.</li>
        <li><strong>Power limits</strong> — <code>PL1</code> and <code>PL2</code> on Intel,
          the package and current limits on AMD. Raising them needs a VRM that can deliver
          what you are asking for.</li>
      </ul>
      <p>
        One more setting has changed in recent years: the <strong>undervolt</strong>. On
        locked modern Intel processors, microcode updates have closed the door on BIOS
        undervolts — the option may still be visible, but the chip will refuse the low
        voltage. On unlocked processors the setting is usually still there.
      </p>

      <p>
        The board itself is a modest consumer. The calculator models a modern motherboard and
        chipset at roughly 7–11 W depending on the board, which is{' '}
        <Link to="/about" className="text-brand-text underline underline-offset-2">
          documented in the methodology
        </Link>
        . Everything above that on this page is about the CPU the board has to feed — the{' '}
        <Link to="/guides/cpu-explained" className="text-brand-text underline underline-offset-2">
          CPU guide
        </Link>{' '}
        covers what the processor asks for, and the{' '}
        <Link to="/guides/cooling-explained" className="text-brand-text underline underline-offset-2">
          cooling guide
        </Link>{' '}
        covers what happens when the board cannot give it.
      </p>
    </>
  ),
};
