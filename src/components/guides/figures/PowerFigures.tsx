/**
 * Power-side figures: PSU efficiency against load, power factor, the
 * connector-to-rail map, and the standby overhead of an oversized unit.
 *
 * Diagrams, not decoration: each one shows a relationship the prose then
 * explains.
 */
import { Caption, INK } from './Caption';

/**
 * 80 PLUS certification minima for a 230 V internal non-redundant supply.
 *
 * `label` says which end of the curve carries the level name — the four lower
 * levels are named at their 20% point on the left, the top one at its 100%
 * point on the right, where there is room.
 */
type PlusLevel = {
  name: string;
  label: 'left' | 'right';
  hero?: boolean;
  points: { load: number; eff: number }[];
};

const PLUS_LEVELS: PlusLevel[] = [
  { name: 'Bronze', label: 'left', points: [{ load: 20, eff: 85 }, { load: 50, eff: 88 }, { load: 100, eff: 85 }] },
  { name: 'Silver', label: 'left', points: [{ load: 20, eff: 87 }, { load: 50, eff: 90 }, { load: 100, eff: 87 }] },
  { name: 'Gold', label: 'left', points: [{ load: 20, eff: 90 }, { load: 50, eff: 92 }, { load: 100, eff: 89 }] },
  { name: 'Platinum', label: 'left', points: [{ load: 20, eff: 92 }, { load: 50, eff: 94 }, { load: 100, eff: 90 }] },
  { name: 'Titanium', label: 'right', hero: true, points: [{ load: 20, eff: 93 }, { load: 50, eff: 95 }, { load: 100, eff: 91 }] },
];

/** A sine wave drawn as a path — used for the voltage and current traces. */
function wave(x0: number, x1: number, period: number, mid: number, amp: number): string {
  const steps = 64;
  const points: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = mid - amp * Math.sin((2 * Math.PI * (x - x0)) / period);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

/** The 80 PLUS minimums against load, with the 50% sweet spot marked. */
export function PsuEfficiencyCurveFigure() {
  const x = (load: number) => 60 + (load / 100) * 370;
  const y = (eff: number) => 260 - ((eff - 80) / 20) * 220;
  const xTicks = [0, 10, 20, 50, 100];
  const yTicks = [80, 85, 90, 95, 100];

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 300"
        role="img"
        aria-label="The 80 PLUS certification minima for a 230 volt supply, from Bronze to Titanium, against the load on the power supply, with the peak of every curve at half load."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        {/* Axes. */}
        <line x1="60" y1="260" x2="430" y2="260" stroke={INK} strokeOpacity={0.3} />
        <line x1="60" y1="40" x2="60" y2="260" stroke={INK} strokeOpacity={0.3} />

        {yTicks.map((t) => (
          <text key={t} x="52" y={y(t) + 3} textAnchor="end" fontSize="9" fill={INK} opacity={0.6}>
            {t}
          </text>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y="274" textAnchor="middle" fontSize="9" fill={INK} opacity={0.6}>
            {t}
          </text>
        ))}
        <text x="60" y="30" fontSize="10" fill={INK} opacity={0.7}>
          efficiency %
        </text>
        <text x="245" y="292" textAnchor="middle" fontSize="10" fill={INK} opacity={0.7}>
          load on the PSU %
        </text>

        {/* The 50% load line every certification curve peaks at. */}
        <line
          x1={x(50)}
          y1="40"
          x2={x(50)}
          y2="260"
          stroke={INK}
          strokeOpacity={0.45}
          strokeDasharray="3 3"
        />
        <text x={x(50) + 6} y="50" fontSize="10" fontWeight="700" fill={INK}>
          the sweet spot
        </text>

        {/* One polyline per certification level, with a dot at each minimum. */}
        {PLUS_LEVELS.map((level) => (
          <g key={level.name}>
            <path
              d={level.points
                .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.load).toFixed(1)},${y(p.eff).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke={level.hero ? '#e5461f' : INK}
              strokeOpacity={level.hero ? 1 : 0.65}
              strokeWidth={level.hero ? 2 : 1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {level.points.map((p) => (
              <circle
                key={p.load}
                cx={x(p.load)}
                cy={y(p.eff)}
                r="2.5"
                fill={level.hero ? '#e5461f' : INK}
              />
            ))}
          </g>
        ))}

        {/* Level names, next to the point each one belongs to. */}
        {PLUS_LEVELS.map((level) => {
          const left = level.label === 'left';
          const point = left ? level.points[0] : level.points[level.points.length - 1];
          return (
            <text
              key={level.name}
              x={left ? 128 : 436}
              y={y(point.eff) + 4}
              textAnchor={left ? 'end' : 'start'}
              fontSize="10"
              fontWeight={level.hero ? 700 : 400}
              fill={INK}
              opacity={level.hero ? 1 : 0.85}
            >
              {level.name}
            </text>
          );
        })}
      </svg>
      <Caption>
        These are the 80 PLUS certification minima for a 230 V internal supply, not measured
        curves — a real unit of a given level beats its number in the middle and falls away
        below about 20% load. A supply that never leaves the low-load end of its own curve is
        converting badly all year.
      </Caption>
    </figure>
  );
}

/** Voltage and current out of phase, and the triangle they make. */
export function PowerFactorFigure() {
  const shift = 32.5;

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 260"
        role="img"
        aria-label="The mains current sine wave lagging behind the voltage wave by an angle theta, beside a triangle of real, reactive and apparent power."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        {/* Time axis and the two zero crossings the phase angle sits between. */}
        <line x1="24" y1="90" x2="288" y2="90" stroke={INK} strokeOpacity={0.25} />
        <line x1="30" y1="86" x2="30" y2="94" stroke={INK} strokeOpacity={0.45} />
        <line x1="62.5" y1="86" x2="62.5" y2="94" stroke={INK} strokeOpacity={0.45} />

        <path d={wave(30, 250, 220, 90, 45)} fill="none" stroke={INK} strokeOpacity={0.35} strokeWidth="1.5" />
        <path d={wave(30 + shift, 250 + shift, 220, 90, 45)} fill="none" stroke="#e5461f" strokeWidth="2" />

        {/* The phase angle between the two zero crossings. */}
        <path d="M30,90 L46.25,122.5 L62.5,90" fill="none" stroke="#e5461f" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M39.1,108.2 A16,16 0 0 1 53.4,108.2" fill="none" stroke="#e5461f" strokeWidth="1.2" />
        <text x="46.25" y="101" textAnchor="middle" fontSize="11" fontWeight="600" fill={INK}>
          θ
        </text>

        {/* Wave key. */}
        <line x1="24" y1="166" x2="44" y2="166" stroke={INK} strokeOpacity={0.35} strokeWidth="1.5" />
        <text x="50" y="169" fontSize="9" fill={INK} opacity={0.7}>
          voltage
        </text>
        <line x1="24" y1="182" x2="44" y2="182" stroke="#e5461f" strokeWidth="2" />
        <text x="50" y="185" fontSize="9" fill={INK} opacity={0.7}>
          current
        </text>
        <text x="24" y="210" fontSize="9" fill={INK} opacity={0.6}>
          the current lags the voltage by θ
        </text>
        <text x="24" y="228" fontSize="9" fill={INK} opacity={0.85} fontWeight="600">
          PF 0.6 → θ ≈ 53°
        </text>

        {/* The power triangle, drawn at the same 53°. */}
        <text x="330" y="40" fontSize="11" fontWeight="600" fill={INK}>
          the power triangle
        </text>
        <path d="M330,200 L420,200 L330,80 Z" fill="#f6c3b4" fillOpacity={0.35} stroke={INK} strokeOpacity={0.6} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M356,200 A26,26 0 0 0 345.6,179.2" fill="none" stroke="#e5461f" strokeWidth="1.2" />
        <text x="360" y="186" fontSize="10" fontWeight="600" fill={INK}>
          θ
        </text>

        <text x="375" y="216" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          real power (W)
        </text>
        <text
          transform="rotate(-90 322 140)"
          x="322"
          y="140"
          textAnchor="middle"
          fontSize="9"
          fill={INK}
          opacity={0.75}
        >
          reactive power (VAR)
        </text>
        <text
          transform="rotate(53.13 384.6 132.8)"
          x="384.6"
          y="132.8"
          textAnchor="middle"
          fontSize="9"
          fill={INK}
          opacity={0.75}
        >
          apparent power (VA)
        </text>
        <text x="375" y="240" textAnchor="middle" fontSize="10" fontWeight="700" fill={INK}>
          PF = real ÷ apparent = cos θ
        </text>
      </svg>
      <Caption>
        A load with a power factor of 0.6 has to pull about 1.7 times more volt-amperes than
        the watts it actually uses — the extra is reactive power the supply has to carry but
        the load never consumes. Active PFC in the PSU pulls the current back into phase with
        the voltage, which is why a modern supply measures about 0.99 and an old one about 0.6.
      </Caption>
    </figure>
  );
}

/** Which socket draws from which internal rail. */
export function PsuConnectorMapFigure() {
  const sockets = [
    { name: '24-pin ATX', rails: '+12V +5V +3.3V +5VSB' },
    { name: '8-pin EPS (CPU)', rails: '+12V' },
    { name: '12V-2x6 (GPU)', rails: '+12V' },
    { name: 'PCIe 6+2 ×2', rails: '+12V +3.3V +5V' },
    { name: 'SATA power ×2', rails: '+5V +3.3V' },
  ];
  const rails = [
    { name: '+12V', feeds: 'CPU · GPU · motherboard', hero: true },
    { name: '+5V', feeds: 'USB · SATA drives', hero: false },
    { name: '+3.3V', feeds: 'memory · chipset · PCIe', hero: false },
    { name: '+5VSB', feeds: 'standby · wake-on-LAN · USB charging', hero: false },
  ];

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 620 300"
        role="img"
        aria-label="The sockets on the face of a power supply, the internal rail bus they feed, and the four rails the supply delivers: twelve volt, five volt, three point three volt and standby."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        {/* The PSU face and the sockets on it. */}
        <rect x="30" y="48" width="230" height="196" rx="10" fill="none" stroke={INK} strokeOpacity={0.35} />
        <text x="44" y="70" fontSize="11" fontWeight="700" fill={INK}>
          PSU
        </text>
        {sockets.map((s, i) => {
          const barY = 80 + i * 30;
          return (
            <g key={s.name}>
              <rect x="44" y={barY} width="202" height="24" rx="5" fill="none" stroke={INK} strokeOpacity={0.5} />
              <text x="52" y={barY + 16} fontSize="10" fill={INK}>
                {s.name}
              </text>
              <text x="238" y={barY + 16} textAnchor="end" fontSize="9" fill={INK} opacity={0.75}>
                {s.rails}
              </text>
              <line x1="246" y1={barY + 12} x2="277" y2={barY + 12} stroke={INK} strokeOpacity={0.4} />
            </g>
          );
        })}

        {/* The internal rail bus every socket feeds into. */}
        <text x="268" y="72" fontSize="9" fill={INK} opacity={0.6}>
          internal rails
        </text>
        <rect x="277" y="80" width="12" height="160" rx="6" fill="#f6c3b4" fillOpacity={0.6} />

        {/* The four rails the supply delivers, and what each one feeds. */}
        {rails.map((r, i) => {
          const railY = 76 + i * 46;
          return (
            <g key={r.name}>
              <line x1="289" y1={railY + 20} x2="350" y2={railY + 20} stroke={INK} strokeOpacity={0.4} />
              <rect
                x="350"
                y={railY}
                width="250"
                height="40"
                rx="6"
                fill={r.hero ? '#f6c3b4' : 'none'}
                fillOpacity={r.hero ? 0.5 : 1}
                stroke={r.hero ? '#e5461f' : INK}
                strokeOpacity={r.hero ? 1 : 0.5}
                strokeWidth={r.hero ? 1.2 : 1}
              />
              {/* The rail name sits on a translucent tint, so it stays ink —
                  the brand border and the tint carry the emphasis. */}
              <text x="362" y={railY + 18} fontSize="12" fontWeight="700" fill={INK}>
                {r.name}
              </text>
              <text x="362" y={railY + 33} fontSize="9" fill={INK} opacity={0.7}>
                {r.feeds}
              </text>
            </g>
          );
        })}
      </svg>
      <Caption>
        Every socket on the PSU face is a bundle of pins grouped by the rail it draws from, so
        the wattage on the label is the total across all the rails rather than what any one
        connector can deliver. The +12V rail is the one that has to cover the CPU and the GPU
        at the same time, which is why a unit with a weak 12 V rail throttles a graphics card
        long before its total wattage runs out.
      </Caption>
    </figure>
  );
}

/** What the wall pays when the machine is idle. */
export function StandbyAndLoadFigure() {
  // Wall draw for a 650 W Gold supply: output asked for, and what the socket
  // has to supply to deliver it (output / efficiency at that load).
  const points = [
    { out: 0, wall: 1 },
    { out: 32, wall: 46 },
    { out: 65, wall: 81 },
    { out: 130, wall: 145 },
    { out: 195, wall: 214 },
    { out: 325, wall: 353 },
    { out: 487, wall: 535 },
    { out: 650, wall: 730 },
  ];
  const x = (out: number) => 60 + (out / 650) * 460;
  const y = (wall: number) => 220 - (wall / 800) * 160;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.out).toFixed(1)},${y(p.wall).toFixed(1)}`).join(' ');
  const area = `${line} L${x(650)},${y(0)} L${x(0)},${y(0)} Z`;

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 280"
        role="img"
        aria-label="Wall draw against the output the machine asks for: about one watt at idle, forty-six watts at a thirty-two watt output, three hundred and fifty-three watts at half load and seven hundred and thirty watts at full load."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <line x1="60" y1="220" x2="520" y2="220" stroke={INK} strokeOpacity={0.3} />
        <line x1="60" y1="60" x2="60" y2="220" stroke={INK} strokeOpacity={0.3} />

        {[0, 200, 400, 600, 800].map((w) => (
          <text key={w} x="52" y={y(w) + 3} textAnchor="end" fontSize="9" fill={INK} opacity={0.6}>
            {w}
          </text>
        ))}
        {[
          { out: 32, label: '32 W (5%)' },
          { out: 130, label: '130 W (20%)' },
          { out: 325, label: '325 W (50%)' },
          { out: 650, label: '650 W (100%)' },
        ].map((t) => (
          <text key={t.out} x={x(t.out)} y="234" textAnchor="middle" fontSize="9" fill={INK} opacity={0.6}>
            {t.label}
          </text>
        ))}
        <text x="60" y="48" fontSize="10" fill={INK} opacity={0.7}>
          wall watts
        </text>
        <text x="290" y="254" textAnchor="middle" fontSize="10" fill={INK} opacity={0.7}>
          output the machine asks for
        </text>

        <path d={area} fill="#f6c3b4" fillOpacity={0.45} />
        <path d={line} fill="none" stroke="#e5461f" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* The worst efficiency sits at the bottom of the curve. */}
        <circle cx={x(32)} cy={y(46)} r="3" fill="#e5461f" />
        <line x1="84" y1="155" x2="83" y2="205" stroke="#e5461f" strokeWidth="1" />
        <text x="60" y="148" fontSize="9" fill={INK} fontWeight="700">
          32 W out → ~46 W at the socket — a third lost
        </text>

        {/* The best efficiency sits at half load. */}
        <circle cx={x(325)} cy={y(353)} r="3" fill="#e5461f" />
        <line x1="288" y1="134" x2="290" y2="146" stroke="#e5461f" strokeWidth="1" />
        <text x="282" y="124" textAnchor="end" fontSize="9" fill={INK} fontWeight="700">
          325 W out → ~353 W — the best point on the curve
        </text>

        {/* Full load: the same percentage, on the largest number. */}
        <circle cx={x(650)} cy={y(730)} r="3" fill="#e5461f" />
        <line x1="514" y1="58" x2="519" y2="70" stroke="#e5461f" strokeWidth="1" />
        <text x="512" y="52" textAnchor="end" fontSize="9" fill={INK} fontWeight="700">
          650 W out → ~730 W
        </text>
      </svg>
      <Caption>
        The loss is a percentage of what the machine asks for, so it grows with the load — but
        the percentage is worst at the bottom of the curve. A supply at 5% of its rating loses
        about a third of a small number; at half load it loses 8% of a large one. An always-on
        machine therefore lives at the worst end of its supply's curve, and the fix is to size
        the supply to the load, not to the peak.
      </Caption>
    </figure>
  );
}
