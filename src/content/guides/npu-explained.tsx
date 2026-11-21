/**
 * "NPU explained: the AI accelerator on your CPU, and whether it saves power"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { CpuDieBlockFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const npuExplained: Guide = {
  slug: 'npu-explained',
  title: 'NPU explained: the AI accelerator on your CPU, and whether it saves power',
  description:
    'What a neural processing unit does, why its TOPS number is not the whole story, and when keeping a PC awake for AI costs more than it saves.',
  minutes: 7,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['npu', 'ai accelerator', 'tops', 'neural engine', 'local ai', 'xDNA', 'ai pc'],
  body: (
    <>
      <p>
        An <strong>NPU</strong> is a small block of dedicated silicon for running neural
        networks. Almost all of its work is one operation repeated — multiply and
        accumulate, over 8-bit or 4-bit integers rather than the 32-bit floats a general
        processor would use. That specialisation cuts both ways, and the second half of
        the cut is the part that matters on a power bill.
      </p>

      <h2>Where they live</h2>
      <p>
        The NPU is a block on the processor package, sitting next to the CPU cores and
        the integrated graphics, and it can be switched off entirely when nothing needs
        it.
      </p>
      <CpuDieBlockFigure />
      <p>
        Intel has put one on its Core Ultra laptops. AMD's Ryzen AI 300 series carries
        its <strong>XDNA</strong> block, Qualcomm's Snapdragon X laptops use a{' '}
        <strong>Hexagon</strong> NPU, and Apple's Macs have shipped a{' '}
        <strong>Neural Engine</strong> for years. Google's <strong>TPU</strong> is the
        same idea scaled up and run in a data centre rather than on your desk.
      </p>
      <p>
        Desktop processors are a different story. Many have no NPU at all, and those that
        do tend to have a much smaller one than the laptop part, because a desktop
        usually runs its AI work on a discrete graphics card.
      </p>

      <h2>What TOPS means, and what it does not</h2>
      <p>
        <strong>TOPS</strong> is trillion operations per second. It is the headline
        number for an AI accelerator, and it is the least useful number on the sheet,
        for three reasons.
      </p>
      <ul>
        <li><strong>It is pinned to one precision.</strong> Almost all of them are quoted
          at 8-bit integers. The same hardware running at 4 bits can do roughly twice as
          many operations, so a 4-bit figure is not comparable with an 8-bit one.</li>
        <li><strong>It is a vendor measurement</strong> on a vendor's own workload,
          using the vendor's own assumptions about what counts as an operation. It is
          not a standard, so it does not transfer between chips.</li>
        <li><strong>It says nothing about the rest of the job.</strong> A model that
          does not fit in memory spends most of its time waiting for weights, and a
          very high TOPS figure does not change that.</li>
      </ul>
      <p>
        The current crop of laptop NPUs sits in roughly the same ballpark of tens of
        TOPS — AMD's XDNA block is quoted at around 50 TOPS and Qualcomm's Hexagon at
        around 45 — so treat the figure as an order of magnitude rather than a
        comparison.
      </p>

      <h2>What an NPU is actually good for</h2>
      <p>
        The sweet spot is small, always-on, low-latency work: background noise
        removal, camera blur and framing effects, on-device transcription, small
        classification models, and the operating system's own effects such as Windows
        Studio Effects. These are jobs where the answer is needed quickly, the model is
        small, and the CPU would otherwise have to be woken up to do it.
      </p>
      <p>
        It is not a local language model machine. A language model is bounded by memory
        bandwidth and by how much of the model fits in memory at all, and neither of
        those is what an NPU is for. The{' '}
        <Link to="/guides/local-ai-power" className="text-brand-text underline underline-offset-2">
          local AI guide
        </Link>{' '}
        covers where the power actually goes for that workload.
      </p>

      <h2>The power twist</h2>
      <p>
        Here is the part that matters on a power-cost site. An NPU is efficient{' '}
        <em>per task</em>. It is not efficient <em>per hour of being switched on</em>.
      </p>
      <p>
        A background model on a desktop that was supposed to be asleep is a reason to
        keep the machine awake. A desktop drawing 50 W while idle costs roughly:
      </p>
      <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-8 my-2">{`50 W × 12 h × 365 d ≈ 219 kWh/year`}</pre>
      <p>
        for twelve hours of every night, to save a few seconds of processor time on a job
        that would otherwise have finished in a second on the processor anyway. The honest
        version of “AI PC” is that the NPU is good work per watt, and the uptime it
        forces is what costs.
      </p>

      <p>
        The{' '}
        <Link to="/guides/running-pc-24-7" className="text-brand-text underline underline-offset-2">
          always-on guide
        </Link>{' '}
        works through the idle arithmetic hour by hour, and the{' '}
        <Link to="/guides/cutting-pc-power" className="text-brand-text underline underline-offset-2">
          cutting power guide
        </Link>{' '}
        covers the alternatives. If you are weighing a chip with an NPU against one
        without, the question is not the TOPS figure — it is whether the machine has to
        stay awake to use it. Price the build in the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>
        , and read{' '}
        <Link to="/guides/cpu-explained" className="text-brand-text underline underline-offset-2">
          what the CPU does
        </Link>{' '}
        for the block the NPU sits next to.
      </p>
    </>
  ),
};
