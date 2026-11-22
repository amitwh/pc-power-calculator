/**
 * "Power factor explained: why your smart plug reads more VA than watts"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { PowerFactorFigure } from '@/components/guides/Figures';
import { Activity } from 'lucide-react';
import type { Guide } from './types';

export const powerFactorCorrection: Guide = {
  slug: 'power-factor-correction',
  title: 'Power factor explained: why your smart plug reads more VA than watts',
  description:
    'What power factor means, what active PFC does inside the power supply, and why an old PSU can trip a UPS that a new one never notices.',
  minutes: 7,
  updated: 'November 2026',
  category: 'power',
  icon: Activity,
  tags: ['power factor', 'pfc', 'reactive power', 'var', 'ups', 'harmonics', 'smart plug'],
  body: (
    <>
      <p>
        A meter can show you more "power" than the machine actually uses, and the extra is
        not wasted electricity. It is <strong>current</strong> that the supply has to carry
        without doing any work with it, and current is what heats cables, sockets and the
        supply's own input stage. Power factor is the number that describes the gap.
      </p>

      <h2>Three quantities, not one</h2>
      <ul>
        <li><strong>Real power</strong> — measured in watts (W). This is the work: the heat
          in the CPU, the light on the screen, the motion of the fan.</li>
        <li><strong>Apparent power</strong> — measured in volt-amperes (VA). This is what the
          cable and the supply have to carry.</li>
        <li><strong>Reactive power</strong> — measured in volt-amperes reactive (VAR). The
          difference between the two, the part that is carried but never consumed.</li>
      </ul>
      <p>
        <strong>Power factor</strong> is real power divided by apparent power:{' '}
        <code>PF = real watts ÷ apparent VA = cos θ</code>, where θ is the angle by which
        the current lags the voltage. A power factor of 1 means every ampere is doing work.
      </p>
      <PowerFactorFigure />
      <p>
        A load with a power factor of 0.6 has to pull about 1.7 times more volt-amperes than
        the watts it actually uses, because its current is roughly 53° out of phase with the
        supply voltage.
      </p>

      <h2>Why a PC's supply ends up out of phase</h2>
      <p>
        A switched-mode supply cannot take current from the mains in the smooth sine wave the
        grid expects. Its input rectifier draws current in short pulses, a few times each
        cycle, and those pulses sit out of phase with the voltage. The supply is asking the
        grid for more current than the work requires.
      </p>
      <p>
        The same pulses are rich in <strong>harmonics</strong> — frequency multiples of the
        mains frequency that other equipment on the same wiring has to carry. A supply that
        behaves this way also makes its input stage work harder, which is more heat inside
        the case.
      </p>

      <h2>What PFC does</h2>
      <p>
        <strong>Active power factor correction</strong> puts a boost converter on the input
        stage and uses it to shape the incoming current into a sine that sits in phase with
        the voltage. The result is a power factor of around 0.99 and a much cleaner current
        waveform, which is why a modern supply measures so close to 1 and an old one does
        not.
      </p>
      <p>
        <strong>Passive PFC</strong> is just a capacitor. It shifts the phase of the current
        a little and improves the number slightly, but it cannot remove the pulse shape or
        the harmonics underneath. Every modern ATX supply has active PFC; passive PFC is a
        relic of the 1990s.
      </p>

      <h2>The rules</h2>
      <ul>
        <li><strong>Energy Star</strong> requires a power factor above 0.9 at 100% of rated
          output for internal supplies above 75 W.</li>
        <li><strong>80 PLUS</strong> requires at least 0.90 at full load for the base level.
          Bronze, Silver and Gold must hold at least 0.90 at 20%, 50% and 100% load, and
          Platinum and Titanium at least 0.95.</li>
      </ul>
      <p>
        These are requirements on the <em>input</em> side of the supply, and they are the
        reason a modern PC does not upset the grid the way older office equipment did. They
        also mean a certified supply is not the reason a cheap one has a poor power factor —
        it is more likely to be an old design.
      </p>

      <h2>Why it matters to you</h2>
      <p>
        A UPS and a home inverter are both sized in VA, because that is what they have to
        carry. So a supply with a poor power factor can overload a UPS that is nominally
        big enough on paper: a machine drawing 400 W at a power factor of 0.6 pulls about
        667 VA, which is more than a 650 VA UPS is rated for. The UPS does not care that the
        machine is only using 400 watts of real power — it sees the current.
      </p>
      <p>
        The same extra current is extra heat in the building's wiring, in the extension lead
        and in the supply's own input stage, and it means a slightly heavier cable for the
        same job. It is not extra kWh you are billed for — your meter measures real power —
        but it is extra current, and extra current is extra heat.
      </p>
      <p>
        If a smart plug or a UPS reports a VA figure well above the watts, that is what is
        happening. The{' '}
        <Link to="/guides/psu-efficiency" className="text-brand-text underline underline-offset-2">
          PSU efficiency guide
        </Link>{' '}
        covers the other half of the conversion — what happens after the current reaches the
        supply — and{' '}
        <Link
          to="/guides/what-each-component-draws"
          className="text-brand-text underline underline-offset-2"
        >
          what each component draws
        </Link>{' '}
        has the watt numbers to compare it against.
      </p>
    </>
  ),
};
