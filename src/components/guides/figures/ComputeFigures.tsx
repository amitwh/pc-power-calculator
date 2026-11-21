/**
 * Compute-side figures: the blocks on a CPU die, the cache hierarchy, the
 * three shapes of compute unit, and the fixed-function GPU pipeline.
 *
 * Diagrams, not decoration: each one shows a relationship the prose then
 * explains.
 */
import { Caption, INK } from './Caption';

/** The blocks on a CPU die: cores with their own caches, shared cache, and the optional extras. */
export function CpuDieBlockFigure() {
  const coreX = [48, 132, 216, 300];

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 620 320"
        role="img"
        aria-label="A CPU package containing four cores each with their own L1 and L2 cache, a shared L3 cache, an optional integrated graphics block and an optional neural processing block, plus memory and PCI Express controllers."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <rect x="30" y="36" width="560" height="256" rx="10" fill="none" stroke={INK} strokeOpacity={0.35} />
        <text x="44" y="58" fontSize="11" fontWeight="700" fill={INK}>
          CPU package
        </text>
        <text x="44" y="73" fontSize="9" fill={INK} opacity={0.6}>
          4–8 cores
        </text>

        {/* Cores, each with its own private caches. */}
        {coreX.map((cx) => (
          <g key={cx}>
            <rect x={cx} y="80" width="76" height="92" rx="6" fill="none" stroke={INK} strokeOpacity={0.55} />
            <text x={cx + 38} y="100" textAnchor="middle" fontSize="10" fill={INK}>
              Core
            </text>
            <rect x={cx + 10} y="110" width="26" height="40" rx="4" fill="#f6c3b4" stroke={INK} strokeOpacity={0.4} />
            <text x={cx + 23} y="134" textAnchor="middle" fontSize="9" fill="#a82d15">
              L1
            </text>
            <rect x={cx + 40} y="110" width="26" height="40" rx="4" fill="#f6c3b4" stroke={INK} strokeOpacity={0.4} />
            <text x={cx + 53} y="134" textAnchor="middle" fontSize="9" fill="#a82d15">
              L2
            </text>
          </g>
        ))}

        {/* The cache every core shares. */}
        <rect x="48" y="182" width="328" height="44" rx="6" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="212" y="202" textAnchor="middle" fontSize="11" fontWeight="600" fill={INK}>
          L3 cache
        </text>
        <text x="212" y="216" textAnchor="middle" fontSize="9" fill={INK} opacity={0.65}>
          shared by every core
        </text>

        {/* The optional blocks, drawn dashed. */}
        <rect x="390" y="80" width="180" height="92" rx="6" fill="none" stroke={INK} strokeOpacity={0.55} strokeDasharray="4 3" />
        <text x="480" y="116" textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>
          iGPU
        </text>
        <text x="480" y="132" textAnchor="middle" fontSize="9" fill={INK} opacity={0.65}>
          graphics
        </text>
        <rect x="390" y="182" width="180" height="44" rx="6" fill="none" stroke={INK} strokeOpacity={0.55} strokeDasharray="4 3" />
        <text x="480" y="202" textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>
          NPU
        </text>
        <text x="480" y="216" textAnchor="middle" fontSize="9" fill={INK} opacity={0.65}>
          AI accelerator
        </text>

        {/* The controllers on the edge of the die. */}
        <rect x="48" y="236" width="328" height="44" rx="6" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="212" y="263" textAnchor="middle" fontSize="11" fill={INK}>
          Memory controller (DDR5)
        </text>
        <rect x="390" y="236" width="180" height="44" rx="6" fill="none" stroke={INK} strokeOpacity={0.55} />
        <text x="480" y="263" textAnchor="middle" fontSize="11" fill={INK}>
          PCIe controller
        </text>

        {/* Legend for the dashed blocks. */}
        <line x1="30" y1="303" x2="52" y2="303" stroke={INK} strokeOpacity={0.55} strokeDasharray="4 3" />
        <text x="58" y="306" fontSize="9" fill={INK} opacity={0.65}>
          dashed = optional on some parts
        </text>
      </svg>
      <Caption>
        A CPU package is a bundle of blocks rather than one uniform piece of logic — four to
        eight cores, each with its own L1 and L2 cache, plus the shared L3 and the memory
        controller, all on the same die. That is why memory latency is a property of the
        processor as much as of the memory. The iGPU and NPU are optional extras that some
        parts carry and others do not, and they can be switched off entirely when nothing
        needs them.
      </Caption>
    </figure>
  );
}

/** The cache pyramid: size on one side, latency on the other. */
export function CacheHierarchyFigure() {
  const bands = [
    { name: 'L1', scope: 'per core', size: '32–64 KB', latency: '~1 ns', halfTop: 55, halfBottom: 100 },
    { name: 'L2', scope: 'per core', size: '0.5–2 MB', latency: '~4–15 ns', halfTop: 100, halfBottom: 145 },
    { name: 'L3', scope: 'shared', size: '8–64 MB', latency: '~15–50 ns', halfTop: 145, halfBottom: 190 },
    { name: 'DRAM', scope: 'main memory', size: 'GBs', latency: '~60–100 ns', halfTop: 190, halfBottom: 235 },
  ];
  const mid = 280;

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 560 300"
        role="img"
        aria-label="A four-level cache pyramid: L1 and L2 private to each core, L3 shared, and DRAM at the bottom, with the size of each level on the left and its latency on the right."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        {bands.map((b, i) => {
          const top = 44 + i * 48;
          const bottom = top + 48;
          const half = (b.halfTop + b.halfBottom) / 2;
          return (
            <g key={b.name}>
              <path
                d={`M${mid - b.halfTop},${top} L${mid + b.halfTop},${top} L${mid + b.halfBottom},${bottom} L${mid - b.halfBottom},${bottom} Z`}
                fill={i === 0 ? '#f6c3b4' : 'none'}
                fillOpacity={0.4}
                stroke={INK}
                strokeOpacity={0.6}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <text x={mid} y={top + 22} textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>
                {b.name}
              </text>
              <text x={mid} y={top + 36} textAnchor="middle" fontSize="9" fill={INK} opacity={0.65}>
                {b.scope}
              </text>
              <text x={mid - half + 12} y={top + 27} fontSize="9" fill={INK} opacity={0.75}>
                {b.size}
              </text>
              <text x={mid + half - 12} y={top + 27} textAnchor="end" fontSize="9" fill={INK} opacity={0.75}>
                {b.latency}
              </text>
            </g>
          );
        })}

        <text x={mid} y="262" textAnchor="middle" fontSize="10" fill={INK} opacity={0.7}>
          size and latency both grow as you go down
        </text>
      </svg>
      <Caption>
        The whole hierarchy exists to keep the CPU off DRAM, because a DRAM round trip is
        roughly sixty to a hundred times slower than an L1 hit. Every level down costs about
        ten times the latency of the one above it, which is why games and AI models — whose
        working sets do not fit in cache — care so much about memory latency and bandwidth.
      </Caption>
    </figure>
  );
}

/** The same silicon budget spent three different ways. */
export function ComputeUnitComparisonFigure() {
  const gpuCols = 14;
  const gpuRows = 8;
  const gpuCell = 8;
  const gpuGap = 2;
  const gpuWidth = gpuCols * gpuCell + (gpuCols - 1) * gpuGap;
  const gpuX = 310 - gpuWidth / 2;
  const gpuY = 96;

  const tile = 26;
  const tileGap = 8;
  const npuX = 510 - (4 * tile + 3 * tileGap) / 2;
  const npuY = 86;

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 620 300"
        role="img"
        aria-label="Three panels side by side: a CPU drawn as a few large cores, a GPU drawn as a dense grid of many tiny lanes, and an NPU drawn as a four by four grid of matrix tiles."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        {/* CPU panel. */}
        <rect x="20" y="36" width="180" height="226" rx="8" fill="none" stroke={INK} strokeOpacity={0.3} />
        <text x="110" y="58" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
          CPU
        </text>
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <g key={`${c}-${r}`}>
              <rect
                x={36 + c * 52}
                y={84 + r * 56}
                width="44"
                height="48"
                rx="4"
                fill="#f6c3b4"
                fillOpacity={0.45}
                stroke={INK}
                strokeOpacity={0.5}
              />
              <text x={58 + c * 52} y={112 + r * 56} textAnchor="middle" fontSize="9" fill={INK}>
                core
              </text>
            </g>
          )),
        )}
        <text x="110" y="228" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          few cores, complex logic,
        </text>
        <text x="110" y="242" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          low latency
        </text>

        {/* GPU panel. */}
        <rect x="220" y="36" width="180" height="226" rx="8" fill="none" stroke={INK} strokeOpacity={0.3} />
        <text x="310" y="58" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
          GPU
        </text>
        {Array.from({ length: gpuCols * gpuRows }, (_, i) => {
          const col = i % gpuCols;
          const row = Math.floor(i / gpuCols);
          return (
            <rect
              key={i}
              x={gpuX + col * (gpuCell + gpuGap)}
              y={gpuY + row * (gpuCell + gpuGap)}
              width={gpuCell}
              height={gpuCell}
              rx="1.5"
              fill="#f6c3b4"
              fillOpacity={0.65}
            />
          );
        })}
        <text x="310" y="228" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          thousands of simple lanes,
        </text>
        <text x="310" y="242" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          high throughput
        </text>

        {/* NPU panel. */}
        <rect x="420" y="36" width="180" height="226" rx="8" fill="none" stroke={INK} strokeOpacity={0.3} />
        <text x="510" y="58" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
          NPU
        </text>
        {[0, 1, 2, 3].map((c) =>
          [0, 1, 2, 3].map((r) => {
            const tx = npuX + c * (tile + tileGap);
            const ty = npuY + r * (tile + tileGap);
            return (
              <g key={`${c}-${r}`}>
                <rect x={tx} y={ty} width={tile} height={tile} rx="4" fill="none" stroke={INK} strokeOpacity={0.55} />
                {[0, 1].map((i) =>
                  [0, 1].map((j) => (
                    <rect
                      key={`${i}-${j}`}
                      x={tx + 5 + i * 8}
                      y={ty + 5 + j * 8}
                      width="6"
                      height="6"
                      rx="1"
                      fill="#e5461f"
                      fillOpacity={0.75}
                    />
                  )),
                )}
              </g>
            );
          }),
        )}
        <text x="510" y="228" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          fixed matrix maths, INT8,
        </text>
        <text x="510" y="242" textAnchor="middle" fontSize="9" fill={INK} opacity={0.75}>
          very low power
        </text>
      </svg>
      <Caption>
        The same silicon budget spent in three different shapes: a handful of very clever
        cores, thousands of simple lanes, or a grid of fixed matrix tiles. A workload either
        fits one of them comfortably or it pays to move data from one to another — and that
        transfer usually costs more than the work itself.
      </Caption>
    </figure>
  );
}

/** The fixed-function stages a frame passes through. */
export function GpuPipelineFigure() {
  const stages = [
    { lines: ['Command', 'buffer'] },
    { lines: ['Vertex', 'shader'] },
    { lines: ['Rasteriser'] },
    { lines: ['Texture', 'units'] },
    { lines: ['ROPs'] },
    { lines: ['Frame buffer', '→ display'] },
  ];
  const boxW = 81;
  const pitch = 101;

  return (
    <figure className="my-5 rounded-12 border border-gray-200 p-3 dark:border-gray-800">
      <svg
        viewBox="0 0 620 220"
        role="img"
        aria-label="The graphics pipeline: a CPU writes a command buffer, and the GPU runs it through the vertex shader, rasteriser, texture units and render operations before the frame buffer reaches the display, with video memory feeding the texture units."
        className="h-auto w-full text-gray-800 dark:text-gray-200"
        fontFamily="inherit"
      >
        <defs>
          <marker id="gpu-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill={INK} />
          </marker>
          <marker id="gpu-arrow-brand" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#e5461f" />
          </marker>
        </defs>

        {/* The GPU, with the pipeline inside it. */}
        <rect x="8" y="76" width="602" height="72" rx="10" fill="none" stroke={INK} strokeOpacity={0.25} />
        <text x="12" y="70" fontSize="10" fontWeight="700" fill={INK} opacity={0.7}>
          GPU
        </text>

        {/* The CPU hands over the work. */}
        <rect x="16" y="14" width="81" height="38" rx="6" fill="none" stroke={INK} strokeOpacity={0.5} />
        <text x="56.5" y="32" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
          CPU
        </text>
        <text x="56.5" y="45" textAnchor="middle" fontSize="9" fill={INK} opacity={0.65}>
          draws the frame
        </text>
        <line x1="56.5" y1="52" x2="56.5" y2="88" stroke="#e5461f" strokeWidth="1.5" markerEnd="url(#gpu-arrow-brand)" />

        {stages.map((s, i) => {
          const bx = 16 + i * pitch;
          const twoLines = s.lines.length > 1;
          return (
            <g key={s.lines[0]}>
              <rect x={bx} y="90" width={boxW} height="46" rx="6" fill="none" stroke={INK} strokeOpacity={0.5} />
              {s.lines.map((line, j) => (
                <text
                  key={line}
                  x={bx + boxW / 2}
                  y={twoLines ? 108 + j * 14 : 117}
                  textAnchor="middle"
                  fontSize={twoLines && j > 0 ? 9 : 10}
                  fill={INK}
                  opacity={twoLines && j > 0 ? 0.65 : 1}
                >
                  {line}
                </text>
              ))}
              {i < stages.length - 1 && (
                <line
                  x1={bx + boxW + 3}
                  y1="113"
                  x2={bx + pitch - 4}
                  y2="113"
                  stroke={INK}
                  strokeOpacity={0.55}
                  strokeWidth="1.2"
                  markerEnd="url(#gpu-arrow)"
                />
              )}
            </g>
          );
        })}

        {/* Video memory feeds the texture units. */}
        <rect x="319" y="160" width="81" height="38" rx="6" fill="none" stroke={INK} strokeOpacity={0.5} />
        <text x="359.5" y="178" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>
          VRAM
        </text>
        <text x="359.5" y="191" textAnchor="middle" fontSize="9" fill={INK} opacity={0.65}>
          textures
        </text>
        <line x1="359.5" y1="160" x2="359.5" y2="138" stroke="#e5461f" strokeWidth="1.5" markerEnd="url(#gpu-arrow-brand)" />
      </svg>
      <Caption>
        The GPU is a pipeline of fixed-function stages rather than a machine that runs a
        program the way the CPU does. The CPU hands over a command buffer and the stages chew
        through it in order, turning lists of triangles into pixels, with the work of every
        triangle spread across all the shader and texture units at once.
      </Caption>
    </figure>
  );
}
