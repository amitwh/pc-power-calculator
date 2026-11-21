/**
 * Bus and board figures: PCIe generations, M.2 form factors, storage speed,
 * memory channels, motherboard layout, cooling loops, thermal throttling and
 * the data path.
 *
 * Diagrams, not decoration: each one shows a relationship the prose then
 * explains.
 */
import { Caption, INK } from './Caption';

/** PCIe x16 bandwidth per direction, after encoding, with the raw link rate. */
export function PcieGenerationFigure() {
  const gens = [
    { gen: 'PCIe 3.0', gt: '8 GT/s per lane', bw: 15.8, raw: 'raw 16 GB/s' },
    { gen: 'PCIe 4.0', gt: '16 GT/s per lane', bw: 31.5, raw: 'raw 32 GB/s' },
    { gen: 'PCIe 5.0', gt: '32 GT/s per lane', bw: 63, raw: 'raw 64 GB/s' },
    { gen: 'PCIe 6.0', gt: '64 GT/s per lane', bw: 126, raw: 'raw 128 GB/s' },
  ];
  const x = (i: number) => 70 + i * 128;
  const y = (gb: number) => 200 - (gb / 140) * 150;

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 600 280"
        role="img"
        aria-label="Bars comparing x16 bandwidth per direction for PCIe 3.0 to 6.0: 15.8, 31.5, 63 and 126 gigabytes per second after encoding, doubling each generation."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <line x1="60" y1="200" x2="560" y2="200" stroke={INK} strokeOpacity={0.3} />
        <line x1="60" y1="40" x2="60" y2="200" stroke={INK} strokeOpacity={0.3} />

        {[0, 40, 80, 120].map((g) => (
          <text key={g} x="52" y={y(g) + 3} textAnchor="end" fontSize="9" fill={INK} opacity={0.6}>
            {g}
          </text>
        ))}
        <text x="60" y="30" fontSize="10" fill={INK} opacity={0.7}>
          x16 bandwidth per direction, after encoding (GB/s)
        </text>

        {gens.map((g, i) => (
          <g key={g.gen}>
            <rect
              x={x(i)}
              y={y(g.bw)}
              width="84"
              height={200 - y(g.bw)}
              rx="4"
              fill={i === 3 ? '#e5461f' : '#f6c3b4'}
              fillOpacity={i === 3 ? 0.9 : 1}
            />
            <text x={x(i) + 42} y={y(g.bw) - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
              {g.bw} GB/s
            </text>
            <text x={x(i) + 42} y="216" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
              {g.gen}
            </text>
            <text x={x(i) + 42} y="229" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
              {g.gt}
            </text>
            <text x={x(i) + 42} y="242" textAnchor="middle" fontSize="9" fill={INK} opacity={0.55}>
              {g.raw}
            </text>
          </g>
        ))}

        <text x="300" y="264" textAnchor="middle" fontSize="9" fill={INK} opacity={0.7}>
          128b/130b encoding costs ~1.5%; PCIe 6.0 uses PAM4 + FLIT
        </text>
      </svg>
      <Caption>
        A generation doubles the transfer rate per lane, not per card — the slot stays x16 and
        the link gets faster. The number on the label is what one direction of the link
        delivers after encoding; the raw link rate under it is the same link before the
        1.5% the 128b/130b coding takes. A GPU is limited by its memory rather than its
        slot, which is why a Gen 5 slot rarely changes a gaming frame rate.
      </Caption>
    </figure>
  );
}

/** The four M.2 lengths drawn to scale, with the key notch positions. */
export function M2FormFactorFigure() {
  // 2 units per millimetre: every module is 22 mm wide, and the notch sits
  // 7 mm from the reference edge for an M key, 11 mm for a B key.
  const mm = 2;
  const width = 22 * mm;
  const modules = [
    { code: '2230', len: 30, key: 'M key', lanes: 'up to x4 PCIe', notches: ['m'], nvme: true },
    { code: '2242', len: 42, key: 'M key', lanes: 'up to x4 PCIe', notches: ['m'], nvme: true },
    { code: '2260', len: 62, key: 'M key', lanes: 'up to x4 PCIe', notches: ['m'], nvme: false },
    { code: '2280', len: 80, key: 'M key', lanes: 'up to x4 PCIe', notches: ['m'], nvme: true },
  ];
  const bottom = 190;
  const notchAt = (m: string) => (m === 'm' ? 7 * mm : 11 * mm);

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 600 260"
        role="img"
        aria-label="The four M.2 lengths drawn to scale, all 22 millimetres wide: 2230, 2242, 2260 and 2280, each with its key notch position marked."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <text x="40" y="22" fontSize="10" fill={INK} opacity={0.7}>
          drawn to scale — every M.2 module is 22 mm wide
        </text>

        {modules.map((m, i) => {
          const mx = 40 + i * 110;
          const top = bottom - m.len * mm;
          // The connector edge is the bottom one; the key notches cut up into it.
          const cuts = m.notches.map(notchAt).sort((a, b) => a - b);
          let d = `M${mx},${top} H${mx + width} V${bottom}`;
          for (const c of cuts) d += ` H${mx + c + 2} V${bottom - 8} H${mx + c - 2} V${bottom}`;
          d += ` H${mx} Z`;
          return (
            <g key={m.code}>
              <path
                d={d}
                fill={m.nvme ? '#f6c3b4' : 'none'}
                fillOpacity={0.35}
                stroke={m.nvme ? '#e5461f' : INK}
                strokeOpacity={m.nvme ? 1 : 0.55}
                strokeWidth={m.nvme ? 1.5 : 1.2}
                strokeLinejoin="round"
              />
              <text x={mx + width / 2} y={top - 6} textAnchor="middle" fontSize="9" fill={INK} opacity={0.7}>
                {m.len} mm
              </text>
              <text x={mx + width / 2} y="206" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
                {m.code}
              </text>
              <text x={mx + width / 2} y="220" textAnchor="middle" fontSize="9" fill={INK} opacity={0.8}>
                {m.key}
              </text>
              <text x={mx + width / 2} y="233" textAnchor="middle" fontSize="9" fill={INK} opacity={0.6}>
                {m.lanes}
              </text>
            </g>
          );
        })}

        {/* The three keys and what each one allows. */}
        <text x="480" y="40" fontSize="10" fontWeight="700" fill={INK}>
          the keys
        </text>
        {[
          { key: 'M key', lanes: 'up to 4 PCIe lanes' },
          { key: 'B key', lanes: '2 PCIe lanes' },
          { key: 'B+M key', lanes: '2 lanes + SATA' },
        ].map((k, i) => (
          <g key={k.key}>
            <text x="480" y={56 + i * 26} fontSize="9" fill={INK} opacity={0.85}>
              {k.key}
            </text>
            <text x="480" y={68 + i * 26} fontSize="9" fill={INK} opacity={0.6}>
              {k.lanes}
            </text>
          </g>
        ))}

        {/* Where the notches sit along the 22 mm edge. */}
        <path
          d={`M480,136 H${480 + width} V156 H${480 + notchAt('b') + 2} V148 H${480 + notchAt('b') - 2} V156 H${480 + notchAt('m') + 2} V148 H${480 + notchAt('m') - 2} V156 H480 Z`}
          fill="none"
          stroke={INK}
          strokeOpacity={0.55}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <line x1={480 + notchAt('m')} y1="156" x2={480 + notchAt('m') - 6} y2="168" stroke={INK} strokeOpacity={0.5} strokeWidth="1" />
        <text x={480 + notchAt('m') - 8} y="172" textAnchor="end" fontSize="9" fill={INK} opacity={0.7}>
          M
        </text>
        <line x1={480 + notchAt('b')} y1="156" x2={480 + notchAt('b') + 6} y2="168" stroke={INK} strokeOpacity={0.5} strokeWidth="1" />
        <text x={480 + notchAt('b') + 8} y="172" fontSize="9" fill={INK} opacity={0.7}>
          B
        </text>
        <text x="480" y="188" fontSize="9" fill={INK} opacity={0.6}>
          notch positions
        </text>

        <text x="300" y="252" textAnchor="middle" fontSize="9" fill={INK} opacity={0.7}>
          outlined in brand: the sizes most NVMe drives use — 2280 above all
        </text>
      </svg>
      <Caption>
        An M.2 slot is a shape and a key, not a speed. The drive inside decides the speed, and
        the key decides how many lanes the slot can carry. Almost every NVMe drive is an
        M-key module, 2280 being the size you will meet most often; the B key and the older
        B+M key are for two-lane cards, and a B-key drive does slot into an M-key socket —
        it just gets two lanes and no SATA.
      </Caption>
    </figure>
  );
}

/** Sequential read speed against the watts each drive takes. */
export function StorageSpeedFigure() {
  const drives = [
    { name: 'HDD', speed: 150, label: '150 MB/s', power: '~9 W spinning (5 W idle)', nvme: false },
    { name: 'SATA SSD', speed: 550, label: '550 MB/s', power: '~5–8 W', nvme: false },
    { name: 'NVMe Gen3 x4', speed: 3500, label: '3,500 MB/s', power: '~7–9 W', nvme: true },
    { name: 'NVMe Gen4 x4', speed: 7000, label: '7,000 MB/s', power: '~8–10 W', nvme: true },
    { name: 'NVMe Gen5 x4', speed: 14000, label: '14,000 MB/s', power: '~9–11 W', nvme: true },
  ];
  const x = (mb: number) => 170 + (mb / 14000) * 300;

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 280"
        role="img"
        aria-label="Horizontal bars of sequential read speed: a hard disk at 150 megabytes per second, a SATA solid state drive at 550, and NVMe drives at 3,500, 7,000 and 14,000, while the power draw stays between five and eleven watts."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <text x="40" y="30" fontSize="10" fill={INK} opacity={0.7}>
          sequential read (MB/s) — bar length is the true ratio
        </text>

        {drives.map((d, i) => {
          const rowY = 52 + i * 44;
          return (
            <g key={d.name}>
              <text x="160" y={rowY + 13} textAnchor="end" fontSize="10" fill={INK}>
                {d.name}
              </text>
              {/* The full-scale track, so a short bar still reads as a bar. */}
              <rect x="170" y={rowY} width="300" height="18" rx="4" fill="#f6c3b4" fillOpacity={0.18} />
              <rect
                x="170"
                y={rowY}
                width={Math.max(x(d.speed) - 170, 3)}
                height="18"
                rx="4"
                fill={d.nvme ? '#e5461f' : '#f6c3b4'}
                fillOpacity={d.nvme ? 0.85 : 1}
              />
              <text x="552" y={rowY + 13} textAnchor="end" fontSize="10" fontWeight="700" fill={INK}>
                {d.label}
              </text>
              <text x="170" y={rowY + 30} fontSize="9" fill={INK} opacity={0.7}>
                {d.power}
              </text>
            </g>
          );
        })}
      </svg>
      <Caption>
        The gap between the last two bars is a hundred times the first — but the watts barely
        move, which is why a fast NVMe drive is one of the best power-per-performance upgrades
        in a build. A spinning disk costs about as much to idle as an NVMe costs to hammer.
      </Caption>
    </figure>
  );
}

/** Two memory channels and the four slots that feed them. */
export function RamChannelFigure() {
  const slots = [
    { id: 'A1', x: 120, filled: true },
    { id: 'A2', x: 176, filled: false },
    { id: 'B1', x: 340, filled: true },
    { id: 'B2', x: 396, filled: false },
  ];

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 260"
        role="img"
        aria-label="A CPU feeding two memory channels into four DIMM slots: with sticks in A1 and B1 the machine runs dual channel at about 96 gigabytes per second, one stick alone gives half that."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        {/* The CPU and its memory controller. */}
        <rect x="200" y="24" width="160" height="46" rx="6" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="280" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
          CPU
        </text>
        <text x="280" y="58" textAnchor="middle" fontSize="9" fill={INK} opacity={0.65}>
          memory controller
        </text>

        {/* The two channels, each a bus tapped into a pair of slots. */}
        <path d="M230,70 V96 H170 V140" fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth="1.5" />
        <path d="M330,70 V96 H390 V140" fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth="1.5" />
        <text x="166" y="88" textAnchor="end" fontSize="9" fill={INK} opacity={0.75}>
          channel A
        </text>
        <text x="394" y="88" fontSize="9" fill={INK} opacity={0.75}>
          channel B
        </text>

        <path d="M170,140 H142 V156" fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth="1.5" />
        <path d="M170,140 H198 V156" fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth="1.5" />
        <path d="M390,140 H362 V156" fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth="1.5" />
        <path d="M390,140 H418 V156" fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth="1.5" />

        {/* The slots themselves; a filled one has a stick in it. */}
        {slots.map((s) => (
          <g key={s.id}>
            <rect
              x={s.x}
              y="156"
              width="44"
              height="60"
              rx="4"
              fill={s.filled ? '#f6c3b4' : 'none'}
              stroke={s.filled ? '#e5461f' : INK}
              strokeOpacity={s.filled ? 1 : 0.4}
              strokeWidth={s.filled ? 1.5 : 1}
            />
            <text
              x={s.x + 22}
              y="180"
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={s.filled ? '#a82d15' : INK}
              opacity={s.filled ? 1 : 0.55}
            >
              {s.id}
            </text>
          </g>
        ))}

        <text x="280" y="236" textAnchor="middle" fontSize="10" fontWeight="700" fill={INK}>
          A1 + B1 = dual channel = 96 GB/s
        </text>
        <text x="280" y="250" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          one stick in A1 alone = single channel = 48 GB/s (DDR5-6000)
        </text>
      </svg>
      <Caption>
        Two sticks in the right slots is free bandwidth — the memory controller can read both
        channels at once, so the machine sees twice the bus. Four sticks can cost stability for
        memory that a game will never use.
      </Caption>
    </figure>
  );
}

/** An ATX board to proportion, with the blocks that decide the lanes. */
export function MotherboardLayoutFigure() {
  const cpuFed = '#f6c3b4';

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 620 380"
        role="img"
        aria-label="An ATX motherboard to proportion, showing the CPU socket and VRM heatsinks, four DIMM slots, two PCI Express slots, two M.2 slots under the graphics area, the chipset, the ATX power headers and the SATA ports."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        {/* The board: 305 x 244 mm at 1.3 units per millimetre. */}
        <rect x="30" y="40" width="397" height="317" rx="6" fill="none" stroke={INK} strokeOpacity={0.4} />

        {/* CPU-fed blocks carry the brand tint. */}
        <rect x="88" y="42" width="54" height="18" rx="4" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="115" y="55" textAnchor="middle" fontSize="9" fill={INK} opacity={0.8}>
          VRM
        </text>
        <rect x="88" y="68" width="54" height="54" rx="4" fill={cpuFed} stroke="#e5461f" strokeWidth="1.2" />
        <text x="115" y="92" textAnchor="middle" fontSize="11" fontWeight="700" fill="#a82d15">
          CPU
        </text>
        <text x="115" y="105" textAnchor="middle" fontSize="9" fill="#a82d15" opacity={0.8}>
          socket
        </text>

        {/* The four DIMM slots, to the right of the socket. */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={154 + i * 14}
            y="58"
            width="10"
            height="86"
            rx="3"
            fill={cpuFed}
            stroke="#e5461f"
            strokeWidth="1"
          />
        ))}
        <text x="175" y="52" textAnchor="middle" fontSize="9" fill={INK} opacity={0.8}>
          DIMM ×4
        </text>

        {/* The first x16 slot hangs off the CPU; the second off the chipset. */}
        <rect x="42" y="158" width="208" height="12" rx="3" fill={cpuFed} stroke="#e5461f" strokeWidth="1.2" />
        <text x="146" y="167" textAnchor="middle" fontSize="9" fill="#a82d15">
          PCIe x16 — from the CPU
        </text>
        <rect x="42" y="186" width="208" height="12" rx="3" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="146" y="195" textAnchor="middle" fontSize="9" fill={INK} opacity={0.8}>
          PCIe x16 — from the chipset
        </text>

        {/* Two M.2 slots under the graphics area, each under a heatsink. */}
        <rect x="42" y="238" width="62" height="10" rx="3" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="73" y="246" textAnchor="middle" fontSize="8" fill={INK} opacity={0.7}>
          heatsink
        </text>
        <rect x="42" y="252" width="168" height="8" rx="3" fill={cpuFed} stroke="#e5461f" strokeWidth="1.2" />
        <text x="126" y="259" textAnchor="middle" fontSize="9" fill="#a82d15">
          M.2 — CPU-fed
        </text>
        <rect x="42" y="268" width="62" height="10" rx="3" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="73" y="276" textAnchor="middle" fontSize="8" fill={INK} opacity={0.7}>
          heatsink
        </text>
        <rect x="42" y="282" width="168" height="8" rx="3" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="126" y="289" textAnchor="middle" fontSize="9" fill={INK} opacity={0.8}>
          M.2 — chipset-fed
        </text>

        {/* The chipset and its heatsink. */}
        <rect x="270" y="186" width="70" height="12" rx="3" fill="none" stroke={INK} strokeOpacity={0.55} />
        <rect x="270" y="202" width="70" height="44" rx="4" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="305" y="228" textAnchor="middle" fontSize="10" fill={INK}>
          chipset
        </text>

        {/* Power headers on the edges. */}
        <rect x="236" y="44" width="22" height="12" rx="3" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="264" y="54" fontSize="9" fill={INK} opacity={0.8}>
          8-pin EPS (CPU power)
        </text>
        <rect x="405" y="86" width="12" height="56" rx="3" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text
          transform="rotate(-90 411 114)"
          x="411"
          y="114"
          textAnchor="middle"
          fontSize="9"
          fill={INK}
          opacity={0.8}
        >
          24-pin ATX
        </text>

        {/* SATA ports along the bottom edge. */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={268 + i * 20}
            y="336"
            width="16"
            height="10"
            rx="2"
            fill="none"
            stroke={INK}
            strokeOpacity={0.55}
          />
        ))}
        <text x="258" y="345" textAnchor="end" fontSize="9" fill={INK} opacity={0.8}>
          SATA
        </text>

        {/* Who feeds what. */}
        <text x="445" y="60" fontSize="10" fontWeight="700" fill={INK}>
          who feeds what
        </text>
        <rect x="445" y="76" width="18" height="12" rx="3" fill={cpuFed} stroke="#e5461f" strokeWidth="1.2" />
        <text x="471" y="86" fontSize="9" fontWeight="600" fill={INK}>
          from the CPU
        </text>
        <text x="471" y="99" fontSize="9" fill={INK} opacity={0.65}>
          socket · DIMMs · x16 · M.2
        </text>
        <rect x="445" y="116" width="18" height="12" rx="3" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="471" y="126" fontSize="9" fontWeight="600" fill={INK}>
          from the chipset
        </text>
        <text x="471" y="139" fontSize="9" fill={INK} opacity={0.65}>
          the slots below them
        </text>
      </svg>
      <Caption>
        The board decides the lanes. The first x16 slot and the first M.2 usually come from the
        CPU, and everything below them comes from the chipset — which is why, on many boards,
        adding a second M.2 drive slows the graphics slot down.
      </Caption>
    </figure>
  );
}

/** Air cooler and closed loop, side by side: both end at the same place. */
export function CoolingLoopFigure() {
  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 620 300"
        role="img"
        aria-label="Two cooling paths side by side: an air cooler stack from the CPU through heat pipes and fins to a fan and the room, and a closed loop from the CPU through a pump and tubes to a radiator and fan."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <defs>
          <marker id="cool-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill={INK} />
          </marker>
        </defs>

        <text x="160" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>
          air cooler
        </text>
        <text x="460" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>
          closed loop (AIO)
        </text>

        {/* Air cooler: a vertical stack with the heat flowing down it. */}
        <rect x="60" y="52" width="120" height="32" rx="5" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="120" y="66" textAnchor="middle" fontSize="9" fill={INK}>
          CPU + heat
        </text>
        <text x="120" y="78" textAnchor="middle" fontSize="9" fill={INK} opacity={0.7}>
          spreader
        </text>
        <line x1="120" y1="82" x2="120" y2="96" stroke={INK} strokeOpacity={0.5} markerEnd="url(#cool-arrow)" />

        <rect x="70" y="98" width="100" height="20" rx="4" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="120" y="112" textAnchor="middle" fontSize="9" fill={INK}>
          heat pipes
        </text>
        <line x1="120" y1="118" x2="120" y2="130" stroke={INK} strokeOpacity={0.5} markerEnd="url(#cool-arrow)" />

        <rect x="60" y="134" width="120" height="42" rx="4" fill="none" stroke={INK} strokeOpacity={0.55} />
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="66"
            y1={140 + i * 5}
            x2="174"
            y2={140 + i * 5}
            stroke={INK}
            strokeOpacity={0.35}
          />
        ))}
        <text x="120" y="169" textAnchor="middle" fontSize="9" fill={INK} opacity={0.85}>
          aluminium fins
        </text>
        <line x1="120" y1="176" x2="120" y2="184" stroke={INK} strokeOpacity={0.5} markerEnd="url(#cool-arrow)" />

        <rect x="60" y="184" width="120" height="28" rx="4" fill="none" stroke={INK} strokeOpacity={0.55} />
        <circle cx="90" cy="198" r="9" fill="none" stroke={INK} strokeOpacity={0.55} />
        <path d="M90,189 L90,207 M81,198 L99,198" stroke={INK} strokeOpacity={0.45} strokeWidth="1" />
        <text x="140" y="202" textAnchor="middle" fontSize="9" fill={INK}>
          fan
        </text>
        <line x1="120" y1="212" x2="120" y2="224" stroke={INK} strokeOpacity={0.5} markerEnd="url(#cool-arrow)" />

        <rect x="60" y="226" width="120" height="22" rx="4" fill="#f6c3b4" fillOpacity={0.4} stroke={INK} strokeOpacity={0.5} />
        <text x="120" y="241" textAnchor="middle" fontSize="9" fill={INK}>
          ambient air
        </text>

        {/* AIO: a closed loop with a radiator on the far side. */}
        <rect x="345" y="80" width="90" height="30" rx="5" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="390" y="99" textAnchor="middle" fontSize="9" fill={INK}>
          CPU block
        </text>
        <line x1="390" y1="110" x2="390" y2="132" stroke={INK} strokeOpacity={0.5} markerEnd="url(#cool-arrow)" />

        <rect x="345" y="134" width="90" height="32" rx="5" fill="none" stroke={INK} strokeOpacity={0.55} />
        <circle cx="360" cy="150" r="7" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="400" y="154" textAnchor="middle" fontSize="9" fill={INK}>
          pump
        </text>

        {/* Hot coolant out to the radiator. */}
        <path
          d="M435,150 H470 V86 H520"
          fill="none"
          stroke="#e5461f"
          strokeWidth="1.5"
          strokeLinejoin="round"
          markerEnd="url(#cool-arrow)"
        />
        {/* Coolant coming back. */}
        <path
          d="M542,186 V202 H390 V168"
          fill="none"
          stroke="#e5461f"
          strokeWidth="1.5"
          strokeLinejoin="round"
          markerEnd="url(#cool-arrow)"
        />
        <text x="452" y="216" fontSize="9" fill={INK} opacity={0.7}>
          tubes
        </text>

        <rect x="520" y="86" width="44" height="100" rx="4" fill="#f6c3b4" fillOpacity={0.4} stroke={INK} strokeOpacity={0.55} />
        <text
          transform="rotate(-90 542 136)"
          x="542"
          y="136"
          textAnchor="middle"
          fontSize="9"
          fill={INK}
        >
          radiator
        </text>
        <circle cx="502" cy="136" r="19" fill="none" stroke={INK} strokeOpacity={0.55} />
        <path d="M502,119 L502,153 M485,136 L519,136" stroke={INK} strokeOpacity={0.45} strokeWidth="1" />
        <text x="502" y="169" textAnchor="middle" fontSize="8" fill={INK} opacity={0.8}>
          fan
        </text>

        {/* Heat leaves the radiator into the room. */}
        <line x1="502" y1="115" x2="502" y2="56" stroke={INK} strokeOpacity={0.5} markerEnd="url(#cool-arrow)" />
        <text x="494" y="70" textAnchor="end" fontSize="9" fill={INK} opacity={0.8}>
          to the room
        </text>
      </svg>
      <Caption>
        Both end in the same place — the heat leaves the die into the room. The AIO just moves
        it with a pump and a bigger surface, and adds a part that can fail.
      </Caption>
    </figure>
  );
}

/** Clock speed against package temperature, and the cliff at the top of it. */
export function ThermalThrottleFigure() {
  const points = [
    { temp: 40, clock: 100 },
    { temp: 60, clock: 100 },
    { temp: 80, clock: 100 },
    { temp: 90, clock: 100 },
    { temp: 95, clock: 97 },
    { temp: 100, clock: 68 },
    { temp: 105, clock: 65 },
  ];
  const x = (t: number) => 60 + ((t - 40) / 65) * 460;
  const y = (c: number) => 190 - ((c - 60) / 40) * 140;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.temp).toFixed(1)},${y(p.clock).toFixed(1)}`).join(' ');

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 260"
        role="img"
        aria-label="A processor's clock speed stays flat until the package reaches about ninety-five degrees, then drops steeply to roughly two thirds before flattening out again."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        {/* Everything above the throttle point. */}
        <rect x={x(95)} y="30" width={x(105) - x(95)} height="160" fill="#f6c3b4" fillOpacity={0.4} />

        <line x1="60" y1="190" x2="520" y2="190" stroke={INK} strokeOpacity={0.3} />
        <line x1="60" y1="30" x2="60" y2="190" stroke={INK} strokeOpacity={0.3} />

        {[60, 70, 80, 90, 100].map((c) => (
          <text key={c} x="52" y={y(c) + 3} textAnchor="end" fontSize="9" fill={INK} opacity={0.6}>
            {c}
          </text>
        ))}
        {[40, 60, 80, 100].map((t) => (
          <text key={t} x={x(t)} y="204" textAnchor="middle" fontSize="9" fill={INK} opacity={0.6}>
            {t}
          </text>
        ))}
        <text x="60" y="24" fontSize="10" fill={INK} opacity={0.7}>
          clock speed (% of maximum)
        </text>
        <text x="290" y="226" textAnchor="middle" fontSize="10" fill={INK} opacity={0.7}>
          package temperature (°C)
        </text>

        <path d={line} fill="none" stroke="#e5461f" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.temp} cx={x(p.temp)} cy={y(p.clock)} r="2.5" fill="#e5461f" />
        ))}

        {/* Where the ceiling is. */}
        <line x1={x(100)} y1="46" x2={x(100)} y2="58" stroke={INK} strokeOpacity={0.5} strokeDasharray="3 3" />
        <text x={x(100)} y="42" textAnchor="middle" fontSize="9" fontWeight="700" fill={INK}>
          Tjmax ≈ 100 °C
        </text>

        {/* Where the drop starts. */}
        <line x1="332" y1="94" x2={x(95) - 2} y2="66" stroke={INK} strokeOpacity={0.5} strokeWidth="1" />
        <text x="330" y="98" textAnchor="end" fontSize="9" fontWeight="600" fill={INK}>
          throttling
        </text>
      </svg>
      <Caption>
        A hot CPU does not break — it slows down, quietly, and the drop is worth more
        performance than most upgrades. The fix is airflow, not silicon.
      </Caption>
    </figure>
  );
}

/** The path a click takes through the machine, and where each workload waits. */
export function DataPathFigure() {
  const chain = [
    { label: 'keyboard / mouse', x: 16, w: 100, hot: false },
    { label: 'USB', x: 136, w: 60, hot: false },
    { label: 'chipset', x: 216, w: 90, hot: false },
    { label: 'CPU', x: 326, w: 80, hot: true },
    { label: 'GPU', x: 426, w: 80, hot: true },
    { label: 'display', x: 526, w: 80, hot: false },
  ];

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 620 300"
        role="img"
        aria-label="The path a click takes: keyboard and mouse over USB to the chipset, on to the CPU, across PCIe to the GPU and out to the display, with RAM on DDR5 below the CPU and storage below the chipset."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <defs>
          <marker id="datapath-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill={INK} />
          </marker>
        </defs>

        {chain.map((c, i) => (
          <g key={c.label}>
            <rect
              x={c.x}
              y="106"
              width={c.w}
              height="36"
              rx="5"
              fill={c.hot ? '#f6c3b4' : 'none'}
              fillOpacity={c.hot ? 0.6 : 1}
              stroke={c.hot ? '#e5461f' : INK}
              strokeOpacity={c.hot ? 1 : 0.55}
              strokeWidth={c.hot ? 1.3 : 1}
            />
            <text x={c.x + c.w / 2} y="128" textAnchor="middle" fontSize="9" fill={INK} fontWeight={c.hot ? 700 : 400}>
              {c.label}
            </text>
            {i < chain.length - 1 && (
              <line
                x1={c.x + c.w + 3}
                y1="124"
                x2={chain[i + 1].x - 4}
                y2="124"
                stroke={INK}
                strokeOpacity={0.55}
                strokeWidth="1.2"
                markerEnd="url(#datapath-arrow)"
              />
            )}
          </g>
        ))}

        {/* The bus between the CPU and the graphics card. */}
        <text x="416" y="156" textAnchor="middle" fontSize="9" fontWeight="600" fill={INK}>
          PCIe
        </text>

        {/* RAM on DDR5, hanging off the CPU. */}
        <line x1="366" y1="142" x2="366" y2="208" stroke={INK} strokeOpacity={0.5} strokeWidth="1.2" markerEnd="url(#datapath-arrow)" />
        <text x="374" y="180" fontSize="9" fontWeight="600" fill={INK}>
          DDR5
        </text>
        <rect x="326" y="210" width="80" height="30" rx="5" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="366" y="229" textAnchor="middle" fontSize="9" fill={INK}>
          RAM
        </text>

        {/* Storage hanging off the chipset. */}
        <line x1="251" y1="142" x2="251" y2="208" stroke={INK} strokeOpacity={0.5} strokeWidth="1.2" markerEnd="url(#datapath-arrow)" />
        <text x="257" y="192" fontSize="9" fill={INK} opacity={0.8}>
          PCIe / SATA
        </text>
        <rect x="196" y="210" width="110" height="30" rx="5" fill="#f6c3b4" fillOpacity={0.6} stroke="#e5461f" strokeWidth="1.3" />
        <text x="251" y="229" textAnchor="middle" fontSize="9" fontWeight="700" fill={INK}>
          NVMe / SATA
        </text>

        {/* Which part each kind of work waits on. */}
        <circle cx="366" cy="84" r="2.5" fill="#e5461f" />
        <circle cx="466" cy="84" r="2.5" fill="#e5461f" />
        <circle cx="230" cy="244" r="2.5" fill="#e5461f" />
        <text x="466" y="98" textAnchor="middle" fontSize="9" fill={INK} opacity={0.85}>
          bottleneck: a game
        </text>
        <text x="366" y="98" textAnchor="middle" fontSize="9" fill={INK} opacity={0.85}>
          bottleneck: a spreadsheet
        </text>
        <text x="230" y="258" textAnchor="middle" fontSize="9" fill={INK} opacity={0.85}>
          bottleneck: a file copy
        </text>
      </svg>
      <Caption>
        The parts of a PC talk over different buses with different bandwidths, and the reason a
        fast CPU does not make a slow game fast is that the frame never reaches it.
      </Caption>
    </figure>
  );
}

/** VRAM bandwidth: how much a wider bus at the same rate is worth. */
export function VramBandwidthFigure() {
  const cards = [
    { label: '128-bit · 21 Gbps', bw: 336, note: '336 GB/s' },
    { label: '192-bit · 21 Gbps', bw: 504, note: '504 GB/s' },
    { label: '384-bit · 21 Gbps', bw: 1008, note: '1,008 GB/s' },
  ];
  const x = (gb: number) => 170 + (gb / 1100) * 270;

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 220"
        role="img"
        aria-label="Memory bandwidth for three graphics cards: a 128-bit bus at 21 gigabits per second gives 336 gigabytes per second, a 192-bit bus 504, and a 384-bit GDDR6X card 1,008."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <text x="40" y="30" fontSize="10" fill={INK} opacity={0.7}>
          memory bandwidth (GB/s)
        </text>

        {cards.map((c, i) => {
          const rowY = 52 + i * 48;
          return (
            <g key={c.label}>
              <text x="160" y={rowY + 14} textAnchor="end" fontSize="10" fill={INK}>
                {c.label}
              </text>
              <rect x="170" y={rowY} width="270" height="20" rx="4" fill="#f6c3b4" fillOpacity={0.18} />
              <rect x="170" y={rowY} width={x(c.bw) - 170} height="20" rx="4" fill="#e5461f" fillOpacity={0.85} />
              <text x="552" y={rowY + 14} textAnchor="end" fontSize="10" fontWeight="700" fill={INK}>
                {c.note}
              </text>
            </g>
          );
        })}

        <text x="280" y="212" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          bandwidth = (bus width ÷ 8) × data rate per pin
        </text>
      </svg>
      <Caption>
        Bandwidth falls out of two numbers: how wide the bus is and how fast each pin moves
        data. Doubling the width doubles the bandwidth at the same rate, which is why a
        384-bit card moves roughly three times the data of a 128-bit one.
      </Caption>
    </figure>
  );
}
