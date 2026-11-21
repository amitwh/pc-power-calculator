/**
 * "PSU connectors explained: ATX, EPS, PCIe and the 600 W 12V-2x6"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { PsuConnectorMapFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const psuConnectors: Guide = {
  slug: 'psu-connectors',
  title: 'PSU connectors explained: ATX, EPS, PCIe and the 600 W 12V-2x6',
  description:
    'Which connector feeds which part, how many you need for a modern GPU, and what changed with the 12VHPWR and 12V-2x6 connectors.',
  minutes: 7,
  updated: 'November 2026',
  category: 'power',
  tags: ['psu connectors', 'atx 24 pin', 'eps', 'pcie 8 pin', '12vhpwr', '12v-2x6', 'modular'],
  body: (
    <>
      <p>
        The cables coming out of a power supply are not interchangeable, and the number of
        them a graphics card needs is the part people get wrong. A card that is fed from
        too few connectors does not just fail to start — it can throttle, or shut down, or
        take the rest of the machine with it.
      </p>

      <h2>The rails inside the supply</h2>
      <p>
        Every connector on the face of a supply is a bundle of pins grouped by the internal
        rail it draws from. There are four that matter:
      </p>
      <ul>
        <li><strong>+12 V</strong> — everything that matters: the CPU, the graphics card and
          the motherboard itself.</li>
        <li><strong>+5 V</strong> — USB ports and SATA drives.</li>
        <li><strong>+3.3 V</strong> — memory, the chipset and the PCIe slots.</li>
        <li><strong>+5 VSB</strong> — standby power: wake-on-LAN, USB charging, and the
          power button itself.</li>
      </ul>
      <PsuConnectorMapFigure />
      <p>
        A modern ATX supply has a <strong>single +12 V rail</strong>. The old designs that
        split it into separate 12 V and 12 V rails are gone, because a modern CPU and GPU
        draw their current in bursts and a shared rail with good transient response handles
        that better. Note also what the figure is showing: the wattage on the label is the
        total across all the rails, not what any one connector can deliver.
      </p>

      <h2>Which connector goes where</h2>
      <ul>
        <li><strong>24-pin ATX</strong> — the board itself: the chipset, the slots, the
          fans, the front panel.</li>
        <li><strong>8-pin EPS</strong> (4+4) — the CPU, and only the CPU. It is a separate
          connector from the 24-pin for a reason, and it is rated for up to about 200 W of
          processor power.</li>
        <li><strong>PCIe 6+2</strong> — an 8-pin with two extra pins that can be folded
          back, so it fits both 6-pin and 8-pin sockets. These feed graphics cards, and each
          one is rated for up to about 150 W. A 300 W card wants two of them, on separate
          cables.</li>
        <li><strong>SATA power</strong> — drives, and the older Molex connector for
          peripherals that predate it.</li>
      </ul>
      <p>
        The CPU is fed by the EPS connector and not through the 24-pin, because the
        processor's current draw is bursty and large. The 12 V rail is the one that has to
        cover the CPU and the graphics card at the same time, which is why a unit with a
        weak 12 V rail can throttle a card long before its total wattage runs out.
      </p>

      <h2>The 600 W connector</h2>
      <p>
        The newest graphics cards draw more than any combination of 8-pin PCIe connectors
        can deliver, and the industry answer has been a single high-current connector.{' '}
        <strong>12VHPWR</strong> was the ATX 3.0 version; <strong>12V-2x6</strong> is the
        ATX 3.1 version, and it is the one to look for. It carries up to 600 W down one
        cable, and it uses heavier 16 AWG conductors to do it.
      </p>
      <p>
        The change that matters is the <strong>sense pins</strong>. The 12V-2x6 has extra
        contacts that tell the graphics card whether the connector is fully seated. That is
        a direct answer to the most-reported failure in modern builds: a connector that
        looked plugged in but was not properly seated, which used to melt the socket. A
        card that detects a bad connection can refuse to draw power rather than cook itself.
      </p>
      <p>
        The route that works is a <strong>native 12V-2x6 cable</strong> from an ATX 3.1
        supply. An adapter that turns four 8-pin PCIe cables into one 12V-2x6, and a
        daisy-chained 8-pin, cannot deliver the full 600 W — they are limited by the
        connectors and the wiring behind them.
      </p>

      <h2>Modular and non-modular</h2>
      <p>
        A <strong>non-modular</strong> supply has every cable hard-wired to it, so the ones
        you are not using have to be bundled out of the way. A <strong>modular</strong> supply
        has sockets on its face for the cables you need, and you leave the rest in the box.
        That is a tidiness difference and nothing else — the electricals, the rails and the
        efficiency are the same.
      </p>

      <h2>A rule for buying</h2>
      <p>
        Count the connectors the card needs, not the wattage. A 750 W supply with the wrong
        cables is worse than a 650 W supply with the right ones, because a card that cannot
        get the power it was promised will complain about it — with throttling, with a black
        screen, or by taking the system down. The{' '}
        <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">
          PSU sizing guide
        </Link>{' '}
        covers how much capacity to buy, and the{' '}
        <Link to="/guides/psu-efficiency" className="text-brand-text underline underline-offset-2">
          PSU efficiency guide
        </Link>{' '}
        covers what happens to the power once it arrives.
      </p>
    </>
  ),
};
