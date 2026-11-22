/**
 * "Cooling explained: air, AIO, and why a hot CPU is slower, not broken"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { CoolingLoopFigure, ThermalThrottleFigure } from '@/components/guides/Figures';
import { Fan } from 'lucide-react';
import type { Guide } from './types';

export const coolingExplained: Guide = {
  slug: 'cooling-explained',
  title: 'Cooling explained: air, AIO, and why a hot CPU is slower, not broken',
  description:
    'How heat leaves a CPU, what thermal throttling costs you in frames, and how to tell whether your cooler is actually the problem.',
  minutes: 8,
  updated: 'November 2026',
  category: 'hardware',
  icon: Fan,
  tags: ['cooling', 'thermal throttling', 'air cooler', 'aio', 'pump', 'fan curve', 'temperature'],
  body: (
    <>
      <p>
        Every watt the CPU spends becomes heat. That makes cooling not a matter of comfort
        or noise but the difference between a chip running at full speed and a chip running
        at a fraction of it — quietly, without a warning, and without a crash. A hot CPU is
        slow, not broken.
      </p>

      <h2>The path the heat takes</h2>
      <p>
        Heat leaves the processor in one direction only. The die makes it, a metal lid
        spreads it out so the cooler can make contact, the cooler carries it away, and
        finally the room air takes it. The cooler's whole job is to move heat from a square
        of silicon a few centimetres across out into the air of the case.
      </p>
      <CoolingLoopFigure />
      <p>
        Both of the common approaches end in the same place: the heat leaves the die into the
        room. A tower cooler does it with heat pipes, a stack of metal fins and a fan; a
        closed-loop cooler does it with a pump, a tube of coolant and a radiator. The
        radiator is the part that actually meets the room air, so the case needs airflow
        through it whatever cooler you buy.
      </p>

      <h2>Air, AIO or custom</h2>
      <ul>
        <li><strong>Tower air cooler</strong> — moves a lot of heat for very few watts, has
          nothing that can leak, and lasts as long as the machine. It needs room above the
          socket, and it is the only option that fits a lot of small cases.</li>
        <li><strong>Closed-loop liquid cooler</strong> — moves more heat into a radiator,
          which is easier to push air through than a tower of fins. It adds a pump, a
          failure mode and a cost, and the pump is the part that eventually stops.</li>
        <li><strong>Custom loop</strong> — a hard block, tubes, a pump and a radiator you
          choose. It is the best-looking and the best-performing option, and it is for
          people who want to build one rather than people who want a quiet PC.</li>
      </ul>
      <p>
        None of them changes the arithmetic of what the machine draws. They change how much
        of the CPU's power budget survives as speed, and how loud the case is while it does
        it.
      </p>

      <h2>The numbers that matter</h2>
      <p>
        Every processor has a maximum package temperature, usually called{' '}
        <strong>Tjmax</strong>, which sits at around 100 °C on modern desktop parts. Before
        it gets there, though, the CPU starts giving up clock speed on purpose.
      </p>
      <p>
        The power limits are where this happens. <strong>Intel</strong> uses{' '}
        <code>PL1</code>, a sustained limit, and <code>PL2</code>, a short-term one that
        lasts a few seconds before the CPU drops back to the sustained figure.{' '}
        <strong>AMD</strong> uses <code>PPT</code> for the whole package, <code>TDC</code>{' '}
        for the current the package can draw, and <code>EDC</code> for the electrical design
        limit of the board. Under sustained load, a processor that reaches the limit will
        hold a lower clock rather than cook itself, and boost features such as Intel's
        Thermal Velocity Boost and AMD's Precision Boost Overdrive trade the last of the
        clock for temperature.
      </p>

      <h2>What throttling costs you</h2>
      <ThermalThrottleFigure />
      <p>
        The curve is flat until the chip gets near its limit and then falls off a cliff. In
        the worst case a modern processor can lose roughly a third of its clock, and it does
        it without anything on screen saying so. In a game that shows up as a lower average
        frame rate and, more noticeably, as worse 1% lows — the stutters when the machine
        hits a heavy scene. Those stutters are often blamed on the graphics card.
      </p>
      <p>
        This is also why a cooler that keeps the CPU at 60 °C and one that keeps it at 90 °C
        are not the same product to the CPU. The first one leaves the boost clock alone.
        The second one does not.
      </p>

      <h2>Diagnosing it before you buy anything</h2>
      <p>
        The test is simple, and it needs two numbers read at the same time: the package
        temperature under load, and the clock speed under the same load.
      </p>
      <ul>
        <li><strong>Hot but still boosting</strong> — 85 °C with the clock sitting near its
          boost value is normal and fine. Nothing needs buying.</li>
        <li><strong>Hot and not boosting</strong> — 95 °C with the clock well below where it
          should be is a real problem, and it is a cooling, case airflow or thermal paste
          problem rather than a silicon one.</li>
        <li><strong>Cool but slow</strong> — low temperatures with a low clock is something
          else entirely: a power limit set in the BIOS, a laptop running unplugged, or a
          driver issue.</li>
      </ul>
      <p>
        Before replacing anything, check the <strong>fan curve</strong> in the BIOS and make
        sure the case has intake and exhaust airflow. A CPU throttling at 95 °C in a case
        with one fan and no intake filter is a case problem, not a cooler problem. Past that,
        thermal paste that has been sitting on the chip for years is the next cheapest thing
        to try.
      </p>

      <p>
        Cooling and power are the same conversation. A cooler that lets the processor hold
        its boost clock is a cooler that lets the processor spend the watts it was given;
        a cooler that cannot is a cooler that quietly throws away performance you paid for.
        The{' '}
        <Link to="/guides/cpu-explained" className="text-brand-text underline underline-offset-2">
          CPU guide
        </Link>{' '}
        covers what the chip does with those watts, and the{' '}
        <Link to="/guides/motherboard-explained" className="text-brand-text underline underline-offset-2">
          motherboard guide
        </Link>{' '}
        covers the board that has to feed it. Add the parts you own to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        to see what the machine draws at full load and what that costs to run.
      </p>
    </>
  ),
};
