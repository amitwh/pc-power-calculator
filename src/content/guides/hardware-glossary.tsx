/**
 * "PC hardware acronyms and terms, explained"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { ComputeUnitComparisonFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const hardwareGlossary: Guide = {
  slug: 'hardware-glossary',
  title: 'PC hardware acronyms and terms, explained',
  description:
    'A plain glossary of the hardware terms that come up in every build guide: CPU, FPU, NPU, iGPU, VRAM, TDP, PCIe, M.2, NVMe, VRM, PF and the rest.',
  minutes: 9,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['glossary', 'acronyms', 'terms', 'jargon', 'tpu', 'npu', 'ipc', 'tdp'],
  body: (
    <>
      <p>
        Hardware jargon is a wall for anyone who did not grow up with it, and most of it
        describes something quite ordinary. This is the wall taken down, one term at a time.
        Each entry says what the term means and what it is for.
      </p>

      <h2>Processors</h2>
      <div className="my-3 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">Term</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">CPU</th>
              <td>Central processing unit. The general-purpose chip that runs the operating
                system and your programs.</td>
            </tr>
            <tr>
              <th scope="row">GPU</th>
              <td>Graphics processing unit. A chip built to do the same arithmetic on
                thousands of things at once, and so to draw the frames.</td>
            </tr>
            <tr>
              <th scope="row">iGPU</th>
              <td>Integrated graphics. Graphics hardware built into the CPU package, sharing
                its memory and its power budget.</td>
            </tr>
            <tr>
              <th scope="row">APU</th>
              <td>Accelerated processing unit. A chip that puts the CPU and integrated
                graphics on the same die.</td>
            </tr>
            <tr>
              <th scope="row">FPU</th>
              <td>Floating-point unit. The part of a core that does arithmetic on decimal
                numbers — the maths behind rendering, science and compression.</td>
            </tr>
            <tr>
              <th scope="row">NPU</th>
              <td>Neural processing unit. A block specialised for running neural networks,
                usually at low precision and very low power.</td>
            </tr>
            <tr>
              <th scope="row">TPU</th>
              <td>Tensor processing unit. A matrix-multiply accelerator. The name is
                Google's; when people say it generally they usually mean an NPU.</td>
            </tr>
            <tr>
              <th scope="row">SoC</th>
              <td>System on a chip. The whole computer on one package — CPU, graphics,
                memory controller and often the radios.</td>
            </tr>
            <tr>
              <th scope="row">TDP</th>
              <td>Thermal design power. The heat the chip is designed to shed. A rough guide
                to how much it draws, not an exact figure.</td>
            </tr>
            <tr>
              <th scope="row">IPC</th>
              <td>Instructions per clock. How much a core gets done per cycle, and the reason
                two chips at the same clock can perform differently.</td>
            </tr>
            <tr>
              <th scope="row">SMT</th>
              <td>Simultaneous multithreading. One core running two hardware threads at
                once, so it can keep more work in flight.</td>
            </tr>
            <tr>
              <th scope="row">Clock and boost</th>
              <td>The frequency the chip runs at, in gigahertz. The boost clock is the
                highest it will reach on its own; the base clock is the guaranteed floor.</td>
            </tr>
            <tr>
              <th scope="row">Core and thread</th>
              <td>A core is a complete execution unit; a thread is a stream of work. With
                SMT on, one core carries two threads.</td>
            </tr>
            <tr>
              <th scope="row">x86-64 and ARM</th>
              <td>Two instruction sets. x86-64 is what desktop PCs run; ARM is what most
                phones and Apple silicon run.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ComputeUnitComparisonFigure />

      <h2>Memory and storage</h2>
      <div className="my-3 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">Term</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">RAM</th>
              <td>Random access memory. The machine's working memory; what is in it is lost
                when the power goes.</td>
            </tr>
            <tr>
              <th scope="row">DIMM</th>
              <td>Dual in-line memory module — the stick itself.</td>
            </tr>
            <tr>
              <th scope="row">DDR4 and DDR5</th>
              <td>The generations of DRAM. DDR5 starts at a higher speed and uses less power
                for the same work.</td>
            </tr>
            <tr>
              <th scope="row">MT/s</th>
              <td>Megatransfers per second — the rate at which the memory moves data. It is
                not the clock in hertz, and it is not the latency.</td>
            </tr>
            <tr>
              <th scope="row">CAS latency</th>
              <td>The number of clock cycles the memory waits for a column to open. The
                useful number is the resulting delay in nanoseconds.</td>
            </tr>
            <tr>
              <th scope="row">Channel</th>
              <td>An independent path to the memory controller. Two sticks in the right
                slots run on two channels, which doubles the bandwidth.</td>
            </tr>
            <tr>
              <th scope="row">VRAM</th>
              <td>The memory attached to a graphics card, holding the textures and buffers it
                is working on.</td>
            </tr>
            <tr>
              <th scope="row">GDDR6 and GDDR6X</th>
              <td>The memory types used on most graphics cards. GDDR6X moves data roughly
                twice as fast per pin as GDDR6.</td>
            </tr>
            <tr>
              <th scope="row">HBM</th>
              <td>High-bandwidth memory. Stacked straight onto the processor package; very
                fast, very expensive, and used on high-end accelerators.</td>
            </tr>
            <tr>
              <th scope="row">SSD</th>
              <td>Solid-state drive. Flash storage with no moving parts.</td>
            </tr>
            <tr>
              <th scope="row">NVMe</th>
              <td>The protocol that lets flash storage speak over PCIe, which is why an
                NVMe drive is so much faster than a SATA one.</td>
            </tr>
            <tr>
              <th scope="row">SATA</th>
              <td>The older interface for drives, and the protocol some M.2 modules use
                instead.</td>
            </tr>
            <tr>
              <th scope="row">HDD</th>
              <td>Hard disk drive. Spinning platters and a moving head — slow to start, but
                cheap per terabyte.</td>
            </tr>
            <tr>
              <th scope="row">TBW</th>
              <td>Terabytes written. The endurance rating of an SSD: how much data can be
                written to it before it wears out.</td>
            </tr>
            <tr>
              <th scope="row">Cache (L1, L2, L3)</th>
              <td>Fast memory built into or beside the processor. L1 is smallest and
                fastest, L3 largest and slowest.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Buses and boards</h2>
      <div className="my-3 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">Term</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">PCIe</th>
              <td>PCI Express. The point-to-point bus that the graphics card, the drives and
                the expansion slots all use.</td>
            </tr>
            <tr>
              <th scope="row">Lane</th>
              <td>One independent serial link inside a PCIe connection. A link is only ever
                between two devices.</td>
            </tr>
            <tr>
              <th scope="row">x16</th>
              <td>A connection carrying sixteen lanes — the usual width for a graphics
                card.</td>
            </tr>
            <tr>
              <th scope="row">M.2</th>
              <td>The physical form factor for a compact card. It is a shape, not a
                speed.</td>
            </tr>
            <tr>
              <th scope="row">Key</th>
              <td>The notch in an M.2 connector edge. The M key carries up to four PCIe
                lanes, B key two, and B+M two lanes plus SATA.</td>
            </tr>
            <tr>
              <th scope="row">Chipset</th>
              <td>The controller on the board that handles the slots, SATA, USB, audio and
                networking the CPU does not do itself.</td>
            </tr>
            <tr>
              <th scope="row">Socket</th>
              <td>The CPU's mechanical and electrical connector on the board. A chip fits
                only the socket it was designed for.</td>
            </tr>
            <tr>
              <th scope="row">VRM</th>
              <td>Voltage regulator module. The MOSFETs and controllers around the socket
                that turn the supply's 12 V into the voltages the CPU needs.</td>
            </tr>
            <tr>
              <th scope="row">BIOS and UEFI</th>
              <td>The firmware on the board. UEFI is what everything ships with now.</td>
            </tr>
            <tr>
              <th scope="row">ATX, mATX, Mini-ITX</th>
              <td>Board sizes: 305 × 244 mm, 244 × 244 mm and 170 × 170 mm.</td>
            </tr>
            <tr>
              <th scope="row">XMP and EXPO</th>
              <td>The memory profiles printed on a RAM kit. Without them the memory runs at
                the JEDEC default instead of the speed on the box.</td>
            </tr>
            <tr>
              <th scope="row">Resizable BAR</th>
              <td>A firmware setting that lets the processor address the graphics card's
                whole memory rather than a small window of it.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Power</h2>
      <div className="my-3 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">Term</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">PSU</th>
              <td>Power supply unit. Converts the mains AC into the DC rails the machine
                runs on.</td>
            </tr>
            <tr>
              <th scope="row">80 PLUS</th>
              <td>The efficiency certification. A level sets a minimum efficiency at 20%,
                50% and 100% load, tested at 230 V.</td>
            </tr>
            <tr>
              <th scope="row">Efficiency</th>
              <td>The share of the power the supply takes in that reaches your parts. The
                rest becomes heat in the case.</td>
            </tr>
            <tr>
              <th scope="row">PF</th>
              <td>Power factor: real power divided by apparent power. How much of the
                current the supply is asked to carry is actually doing work.</td>
            </tr>
            <tr>
              <th scope="row">PFC</th>
              <td>Power factor correction. Active PFC uses a boost converter to bring the
                input current back into phase with the mains.</td>
            </tr>
            <tr>
              <th scope="row">VAR</th>
              <td>Volt-amperes reactive. The power that is carried but never consumed.</td>
            </tr>
            <tr>
              <th scope="row">VA</th>
              <td>Volt-amperes. What the cable and the supply have to carry, and the unit a
                UPS is rated in.</td>
            </tr>
            <tr>
              <th scope="row">EPS</th>
              <td>The 8-pin CPU power connector, separate from the 24-pin board
                connector.</td>
            </tr>
            <tr>
              <th scope="row">12V-2x6</th>
              <td>The ATX 3.1 high-current graphics connector. It carries up to 600 W down
                one cable, and its sense pins let the card detect a poorly seated
                connector.</td>
            </tr>
            <tr>
              <th scope="row">Modular</th>
              <td>A supply with sockets for the cables you need, so the unused ones stay in
                the box.</td>
            </tr>
            <tr>
              <th scope="row">Ripple</th>
              <td>The AC noise riding on the DC output rails.</td>
            </tr>
            <tr>
              <th scope="row">Transient</th>
              <td>A short, sharp spike in load — what a graphics card does when a new scene
                loads.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Thermals and acoustics</h2>
      <div className="my-3 overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">Term</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Tjmax</th>
              <td>The maximum package temperature a processor is specified to reach, around
                100 °C on modern desktop parts.</td>
            </tr>
            <tr>
              <th scope="row">Thermal throttling</th>
              <td>The processor reducing its own clock to stay inside its temperature
                limits.</td>
            </tr>
            <tr>
              <th scope="row">PL1 and PL2</th>
              <td>Intel's sustained and short-term power limits.</td>
            </tr>
            <tr>
              <th scope="row">PPT, TDC and EDC</th>
              <td>AMD's package, current and electrical design limits.</td>
            </tr>
            <tr>
              <th scope="row">Thermal paste</th>
              <td>The compound between the chip and the cooler's base. It fills the
                microscopic gaps that air cannot.</td>
            </tr>
            <tr>
              <th scope="row">Fan curve</th>
              <td>The mapping from temperature to fan speed, set in the BIOS.</td>
            </tr>
            <tr>
              <th scope="row">dBA</th>
              <td>Decibels A-weighted — how loud something is, weighted to match what the
                human ear actually notices.</td>
            </tr>
            <tr>
              <th scope="row">Airflow</th>
              <td>The volume of air moving through the case, usually quoted in CFM.</td>
            </tr>
            <tr>
              <th scope="row">CFM</th>
              <td>Cubic feet per minute — a measure of how much air a fan or case
                moves.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>A note on “IU”</h2>
      <p>
        <strong>IU is not a standard hardware term.</strong> When people write it, they
        usually mean one of two things:
      </p>
      <ul>
        <li>the <strong>iGPU</strong> — the integrated graphics unit built into the
          processor; or</li>
        <li>the <strong>instruction unit</strong> — the part of a core that fetches and
          decodes instructions before the execution units run them.</li>
      </ul>
      <p>
        If a shop wrote “IU” on a spec sheet, ask which one they mean. The two have nothing
        to do with each other, and only one of them is a thing you would ever be choosing.
      </p>

      <p>
        For the terms in context rather than in a list, the{' '}
        <Link to="/guides/how-a-pc-works" className="text-brand-text underline underline-offset-2">
          guide to how a PC works
        </Link>{' '}
        walks the whole machine from the plug to the screen, and the{' '}
        <Link to="/guides/cpu-explained" className="text-brand-text underline underline-offset-2">
          CPU guide
        </Link>{' '}
        opens up the processor in detail. When you want to know what a set of parts actually
        costs to run, add them to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        and it works out the wall draw, the units and the bill.
      </p>
    </>
  ),
};
