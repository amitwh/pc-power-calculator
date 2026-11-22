/**
 * "FPU explained: the floating-point unit and the maths your PC does"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { ComputeUnitComparisonFigure } from '@/components/guides/Figures';
import { Sigma } from 'lucide-react';
import type { Guide } from './types';

export const fpuExplained: Guide = {
  slug: 'fpu-explained',
  title: 'FPU explained: the floating-point unit and the maths your PC does',
  description:
    'What an FPU does, why IEEE 754 floats have their famous precision problems, and why a GPU is 64× slower than the CPU at the same maths.',
  minutes: 7,
  updated: 'November 2026',
  category: 'hardware',
  icon: Sigma,
  tags: ['fpu', 'floating point', 'ieee 754', 'simd', 'avx', 'avx-512', 'fp64'],
  body: (
    <>
      <p>
        The <strong>floating-point unit</strong> is the part of a core that does
        arithmetic on numbers with a decimal point. Everything from a spreadsheet to a
        physics simulation to a game's shader runs through it. It is separate from the
        integer unit because it needs different circuitry, and it is where the famous
        precision problems come from.
      </p>

      <h2>Half, single and double</h2>
      <p>
        A <strong>floating-point number</strong> stores a value as a sign, an exponent
        and a mantissa, which lets it represent an enormous range of magnitudes. The
        standard that defines all of this is <strong>IEEE 754</strong>, and it defines
        three widths in common use:
      </p>
      <ul>
        <li><strong>Half precision</strong> — 16 bits. Very small, very fast, low
          accuracy. Used where memory bandwidth matters more than precision, and
          increasingly for neural network weights.</li>
        <li><strong>Single precision</strong> — 32 bits. The default for graphics and
          games, and the default for AI accelerators.</li>
        <li><strong>Double precision</strong> — 64 bits. The default for scientific
          work, and roughly twice the storage and the work of single.</li>
      </ul>
      <p>
        The famous <code>0.1 + 0.2 !== 0.3</code> is not a bug. 0.1 has no exact binary
        representation, so it is stored as the nearest double that is close to it, and
        the two nearest doubles do not add back to exactly the number you started with.
        IEEE 754 specifies the rounding rules precisely so that every machine gets the
        same answer. The discrepancy is a property of the format, not of your processor.
      </p>

      <h2>Vector maths and FMA</h2>
      <p>
        Modern processors do arithmetic in <strong>vectors</strong> — several numbers at
        once, in a single instruction. The width is set by the instruction set:
      </p>
      <ul>
        <li><strong>SSE</strong> — 128-bit vectors, four single-precision values at a
          time.</li>
        <li><strong>AVX and AVX2</strong> — 256-bit vectors, eight single-precision
          values at a time.</li>
        <li><strong>AVX-512</strong> — 512-bit vectors, sixteen single-precision values
          at a time.</li>
      </ul>
      <p>
        On top of that sits <strong>FMA</strong> — fused multiply-add — which multiplies
        and adds in one step with a single rounding, instead of rounding twice. It is
        worth a few percent of throughput, and it is used almost everywhere.
      </p>
      <p>
        AVX-512 is the awkward one. While a core is running 512-bit instructions it
        draws more power and generates more heat, and several designs respond by
        dropping their clock for the duration. A wider vector is not free.
      </p>

      <h2>Why a GPU is 64× slower at the same maths</h2>
      <p>
        A GPU is not a faster CPU; it is a different shape of machine. It has thousands
        of simple lanes instead of a few clever cores, which is why it wins on workloads
        that repeat the same arithmetic thousands of times and loses on anything that
        needs branching or irregular access.
      </p>
      <ComputeUnitComparisonFigure />
      <p>
        <strong>Double precision</strong> is where the gap becomes dramatic. A consumer
        graphics card is built around single-precision hardware, and its double-precision
        results are produced through that same fast path rather than by dedicated
        double-precision units. On consumer parts the double-precision rate is{' '}
        <strong>1/64</strong> of the single-precision rate. A CPU, by contrast, has
        double-precision hardware throughout.
      </p>
      <p>
        So the honest version of the headline is this: a gaming card is 64 times slower
        than itself at doubles, and slower still than a CPU doing the same doubles. For
        scientific work that needs true 64-bit precision, a gaming GPU is not a
        substitute at any price.
      </p>

      <h2>Where the watts go</h2>
      <p>
        The vector units are among the most power-hungry blocks on a die. Heavy
        floating-point work pushes up both the clock and the voltage, and voltage and
        current are what a watt is made of.
      </p>
      <p>
        This is why a laptop that hits its power limit slows down before it finishes the
        job. A thin-and-light machine has a smaller cooling system and a lower sustained
        power budget, so a workload that is entirely arithmetic — rendering, compiling,
        training — will clock down and take longer, rather than run at the speed the
        specification implies.
      </p>

      <p>
        None of this changes what the machine pulls from the wall; it changes how much
        work each watt does. The{' '}
        <Link to="/guides/cpu-explained" className="text-brand-text underline underline-offset-2">
          CPU guide
        </Link>{' '}
        covers where a processor's watts come from, and the{' '}
        <Link to="/guides/what-each-component-draws" className="text-brand-text underline underline-offset-2">
          component draw guide
        </Link>{' '}
        puts the processor's share of a build next to the graphics card's. To price your
        own machine, add the parts to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>
        .
      </p>
    </>
  ),
};
