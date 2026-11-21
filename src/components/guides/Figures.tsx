/**
 * Inline SVG figures for the guides.
 *
 * Diagrams, not decoration: each one shows a relationship the prose then
 * explains. They are hand-drawn SVG (no image files, no chart library) so they
 * stay crisp in print, inherit the page's type, and cost the reader no extra
 * request.
 *
 * This module is the barrel: the figures themselves live in `figures/`, one
 * file per topic, and are re-exported here so every guide keeps importing
 * them from `@/components/guides/Figures`.
 */
import { Caption, INK } from './figures/Caption';

export { Caption, INK } from './figures/Caption';
export {
  PsuEfficiencyCurveFigure,
  PowerFactorFigure,
  PsuConnectorMapFigure,
  StandbyAndLoadFigure,
} from './figures/PowerFigures';
export {
  CpuDieBlockFigure,
  CacheHierarchyFigure,
  ComputeUnitComparisonFigure,
  GpuPipelineFigure,
} from './figures/ComputeFigures';
export {
  PcieGenerationFigure,
  M2FormFactorFigure,
  StorageSpeedFigure,
  RamChannelFigure,
  MotherboardLayoutFigure,
  CoolingLoopFigure,
  ThermalThrottleFigure,
  DataPathFigure,
  VramBandwidthFigure,
} from './figures/BusFigures';

/** Wall → UPS → PSU → components, with where the losses happen. */
export function PowerPathFigure() {
  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 640 150"
        role="img"
        aria-label="Mains AC passes through a UPS and a power supply before reaching the components; each stage loses energy as heat."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill={INK} />
          </marker>
        </defs>

        {[
          { x: 10, label: 'Mains', sub: 'AC at the socket' },
          { x: 175, label: 'UPS', sub: '≈95% efficient' },
          { x: 340, label: 'PSU', sub: '≈90% at this load' },
          { x: 505, label: 'Components', sub: 'CPU · GPU · drives' },
        ].map((box, i) => (
          <g key={box.label}>
            <rect
              x={box.x}
              y={40}
              width={125}
              height={48}
              rx={8}
              fill="none"
              stroke={INK}
              strokeOpacity={i === 0 || i === 3 ? 0.3 : 0.75}
              strokeDasharray={i === 0 || i === 3 ? '4 3' : undefined}
            />
            <text x={box.x + 62} y={62} textAnchor="middle" fontSize="12" fontWeight="600" fill={INK}>
              {box.label}
            </text>
            <text x={box.x + 62} y={77} textAnchor="middle" fontSize="9" fill={INK} opacity={0.65}>
              {box.sub}
            </text>
            {i < 3 && (
              <line
                x1={box.x + 128}
                y1={64}
                x2={box.x + 160}
                y2={64}
                stroke={INK}
                strokeOpacity={0.6}
                markerEnd="url(#arrow)"
              />
            )}
          </g>
        ))}

        {/* Loss arrows drop out of the two conversion stages. */}
        {[
          { x: 237, label: '≈5% lost' },
          { x: 402, label: '≈10% lost' },
        ].map((l) => (
          <g key={l.label}>
            <path
              d={`M${l.x},92 L${l.x},116`}
              stroke="#e5461f"
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x={l.x + 6} y={128} fontSize="9" fill={INK} fontWeight="600">
              {l.label}
            </text>
          </g>
        ))}
      </svg>
      <Caption>
        Every stage between the socket and a component loses part of the energy as heat. The
        calculator converts component draw to wall draw through both curves, which is why the
        wall figure is always the larger number.
      </Caption>
    </figure>
  );
}

/** How a tiered tariff prices the next unit. */
export function TariffSlabFigure() {
  const bars = [
    { label: '0–100', rate: 5.67, h: 52 },
    { label: '101–300', rate: 9.9, h: 90 },
    { label: '301+', rate: 11.0, h: 100 },
  ];
  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 170"
        role="img"
        aria-label="Three tariff slabs with rising rates; a PC's units are priced at the highest slab the household reaches."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <line x1="40" y1="130" x2="530" y2="130" stroke={INK} strokeOpacity={0.3} />
        {bars.map((b, i) => {
          const x = 60 + i * 150;
          return (
            <g key={b.label}>
              <rect
                x={x}
                y={130 - b.h}
                width={96}
                height={b.h}
                rx={4}
                fill={i === bars.length - 1 ? '#e5461f' : '#f6c3b4'}
                fillOpacity={i === bars.length - 1 ? 0.9 : 1}
              />
              <text x={x + 48} y={124 - b.h} textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
                {b.rate.toFixed(2)}
              </text>
              <text x={x + 48} y={146} textAnchor="middle" fontSize="10" fill={INK} opacity={0.7}>
                {b.label} kWh
              </text>
              <text x={x + 48} y={160} textAnchor="middle" fontSize="9" fill={INK} opacity={0.5}>
                rate per unit
              </text>
            </g>
          );
        })}
        <text x={40} y={22} fontSize="10" fill={INK} fontWeight="700">
          The next unit you add is priced here →
        </text>
      </svg>
      <Caption>
        A PC's energy does not pay the average rate on your bill: it pays the top slab your
        household has already reached, plus duty. The last bar is the one that matters for new
        load, which is why the calculator walks the slabs instead of multiplying units by an
        average.
      </Caption>
    </figure>
  );
}

/** Component draw against utilisation — idle is not zero. */
export function LoadCurveFigure() {
  const pts = [
    { u: 0, w: 10 },
    { u: 20, w: 55 },
    { u: 50, w: 160 },
    { u: 80, w: 300 },
    { u: 100, w: 420 },
  ];
  const x = (u: number) => 50 + (u / 100) * 450;
  const y = (w: number) => 130 - (w / 440) * 100;
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.u)},${y(p.w)}`).join(' ');
  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 550 165"
        role="img"
        aria-label="A GPU's power rises with utilisation but is never zero: it draws about ten watts at idle and its rated power at full load."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <line x1={50} y1={130} x2={520} y2={130} stroke={INK} strokeOpacity={0.3} />
        <line x1={50} y1={30} x2={50} y2={130} stroke={INK} strokeOpacity={0.3} />
        <path d={path} fill="none" stroke="#e5461f" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((p) => (
          <circle key={p.u} cx={x(p.u)} cy={y(p.w)} r="3" fill="#e5461f" />
        ))}
        <text x={50} y={148} fontSize="10" fill={INK} opacity={0.7}>
          idle
        </text>
        <text x={520} y={148} fontSize="10" fill={INK} opacity={0.7} textAnchor="end">
          full load
        </text>
        <text x={56} y={44} fontSize="10" fill={INK} opacity={0.7}>
          watts
        </text>
        <text x={x(0) + 8} y={y(10) - 8} fontSize="10" fill={INK} opacity={0.8}>
          ~10 W at idle
        </text>
        <text x={x(100) - 6} y={y(420) - 8} fontSize="10" fill={INK} opacity={0.8} textAnchor="end">
          rated power
        </text>
      </svg>
      <Caption>
        Utilisation is not a switch. A card at 20% is not "using a fifth of its watts" in the way a
        lamp uses a fifth of its brightness — the curve is flatter at the top and never reaches
        zero. Idle draw is what makes an always-on machine expensive.
      </Caption>
    </figure>
  );
}
