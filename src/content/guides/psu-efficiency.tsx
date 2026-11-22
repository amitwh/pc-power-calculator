/**
 * "PSU efficiency explained: 80 PLUS, the load curve and why Gold is not automatically better"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { PsuEfficiencyCurveFigure, StandbyAndLoadFigure } from '@/components/guides/Figures';
import { Zap } from 'lucide-react';
import type { Guide } from './types';

export const psuEfficiency: Guide = {
  slug: 'psu-efficiency',
  title: 'PSU efficiency explained: 80 PLUS, the load curve and why Gold is not automatically better',
  description:
    'What the 80 PLUS badge actually measures, why a PSU is least efficient at very low load, and how the rating changes your bill on an Indian tariff.',
  minutes: 7,
  updated: 'November 2026',
  category: 'power',
  icon: Zap,
  tags: ['80 plus', 'psu efficiency', 'gold', 'bronze', 'efficiency curve', 'psu rating'],
  body: (
    <>
      <p>
        Two numbers on a power supply's box mean very different things. The wattage is how
        much it can deliver to your parts. The efficiency badge is how much of what it takes
        in it hands on to those parts, and how much it burns as heat on the way. The badge is
        a measurement, but it is a measurement of a curve, not of a single number — and that
        is where the badge gets misread.
      </p>

      <h2>What the badge actually measures</h2>
      <p>
        80 PLUS is a certification for internal power supplies tested at 230 V — which is
        India's mains voltage. Each level sets a <strong>minimum efficiency</strong> at three
        load points: 20% of the supply's rating, 50% of it, and 100% of it.
      </p>

      <div className="my-3 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">At 20% load</th>
              <th scope="col">At 50% load</th>
              <th scope="col">At 100% load</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Bronze</th>
              <td>85%</td>
              <td>88%</td>
              <td>85%</td>
            </tr>
            <tr>
              <th scope="row">Silver</th>
              <td>87%</td>
              <td>90%</td>
              <td>87%</td>
            </tr>
            <tr>
              <th scope="row">Gold</th>
              <td>90%</td>
              <td>92%</td>
              <td>89%</td>
            </tr>
            <tr>
              <th scope="row">Platinum</th>
              <td>92%</td>
              <td>94%</td>
              <td>90%</td>
            </tr>
            <tr>
              <th scope="row">Titanium</th>
              <td>93%</td>
              <td>95%</td>
              <td>91%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        These are the <strong>minima</strong> a certified unit has to meet, not measured
        curves. A real supply of a given level beats its number in the middle of the range
        and falls away below about 20% load, which is why two Gold units do not behave
        identically.
      </p>
      <PsuEfficiencyCurveFigure />

      <h2>The shape of the curve</h2>
      <p>
        Every supply has a sweet spot somewhere around half of its rating, and it is worse
        at both ends. At 10% load the supply's own overhead — the control circuitry, the
        fan, the losses in its input stage — is a large share of a very small number. At
        100% load the conversion itself gets harder, the components are running hot, and
        the curve falls away again.
      </p>
      <p>
        This is why the calculator divides by the efficiency curve at the load the machine is
        actually running, rather than by a single efficiency figure printed on the box.
      </p>

      <h2>What it means for an ordinary PC</h2>
      <p>
        The loss is a <strong>percentage of what the machine asks for</strong>, so it grows
        in absolute terms with the load — but the <em>rate</em> is worst at the bottom of the
        curve. A 650 W Gold supply asked for 32 W takes about 46 W from the socket: roughly a
        third, lost from a small number. Asked for 325 W, it takes about 353 W — 8% of a
        large number. Asked for the full 650 W, it takes about 730 W.
      </p>
      <StandbyAndLoadFigure />
      <p>
        The consequence for an always-on machine is easy to miss. A server that idles all day
        lives at the worst end of its supply's curve, where the rate of loss is highest. And
        an oversized supply does not burn tens of watts of overhead — a supply that is far
        too big loses a few watts, not tens. The large always-on cost is the{' '}
        <em>system's</em> idle draw, not the supply's inefficiency. Sizing the supply to the
        load is still worth doing, but it is not where the money is.
      </p>

      <h2>What it means for the bill</h2>
      <p>
        Take the difference between a Bronze and a Gold unit at the same load. It is a few
        watts — call it 5 W. Over a year of running 24 hours a day that is:
      </p>
      <p>
        <code>5 W × 24 h × 365 d ≈ 43.8 kWh</code>
      </p>
      <p>
        That is a small number of units against a household's consumption, but units are
        priced at the slab the household has already reached, so they are not the cheapest
        money on the bill. The{' '}
        <Link to="/cost/in/mh" className="text-brand-text underline underline-offset-2">
          cost walk for an Indian household
        </Link>{' '}
        prices those units against the tariff, and the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        works the whole thing out from your build's actual wall draw.
      </p>
      <p>
        The bigger money is in how long the machine is on. The{' '}
        <Link to="/guides/running-pc-24-7" className="text-brand-text underline underline-offset-2">
          guide to running a PC 24/7
        </Link>{' '}
        covers the levers that actually move the bill, and{' '}
        <Link
          to="/guides/wall-power-vs-component-power"
          className="text-brand-text underline underline-offset-2"
        >
          wall power against component power
        </Link>{' '}
        explains where the conversion between the two happens.
      </p>

      <h2>What the badge does not tell you</h2>
      <p>
        80 PLUS measures efficiency and nothing else. It says nothing about:
      </p>
      <ul>
        <li><strong>Transient response</strong> — how the supply copes with a GPU's
          millisecond-scale load spikes. This is what the{' '}
          <Link to="/guides/psu-sizing" className="text-brand-text underline underline-offset-2">
            PSU sizing guide
          </Link>{' '}
          covers.</li>
        <li><strong>Protections</strong> — over-current, over-voltage, short-circuit and
          the rest.</li>
        <li><strong>Ripple</strong> — the noise riding on the DC output rails.</li>
        <li><strong>Fan noise and build quality</strong> — which is why a cheap unit can
          take a graphics card down with it.</li>
      </ul>
      <p>
        So Gold is worth buying, but it is not the reason a machine works. Buy for the
        protections, the transient response and the warranty; take the efficiency badge as
        the bonus it is.
      </p>
    </>
  ),
};
