/**
 * "What the GPU does: shader cores, the graphics pipeline and why it eats the watts"
 *
 * Why: one file per guide — the article set is tripling, so the content
 * lives in `src/content/guides/` and the page shell only renders it.
 */
import { Link } from 'react-router-dom';
import { GpuPipelineFigure, LoadCurveFigure } from '@/components/guides/Figures';
import type { Guide } from './types';

export const gpuExplained: Guide = {
  slug: 'gpu-explained',
  title: 'What the GPU does: shader cores, the graphics pipeline and why it eats the watts',
  description:
    'How a graphics card turns triangles into pixels, what the shader cores and tensor cores actually do, and why the GPU is usually the biggest line on your bill.',
  minutes: 8,
  updated: 'November 2026',
  category: 'hardware',
  tags: ['gpu', 'graphics card', 'shader cores', 'cuda', 'tensor cores', 'ray tracing', 'dlss'],
  body: (
    <>
      <p>
        A graphics card is a machine built to do one thing: apply the same arithmetic to
        thousands of things at the same time. The CPU decides what should happen, and the
        GPU draws it. That division of labour is why a card can finish a frame in
        milliseconds, and why it is so often the biggest line on an electricity bill.
      </p>

      <h2>The pipeline is a machine, not a program</h2>
      <p>
        A frame does not arrive as a picture. It arrives as a list of triangles and a set
        of instructions, and the CPU assembles them into a <strong>command buffer</strong>{' '}
        that it hands over to the card. The GPU then works through that buffer in a fixed
        order:
      </p>
      <ul>
        <li><strong>Vertex stage</strong> — turns each triangle's three points into
          positions on the screen.</li>
        <li><strong>Rasteriser</strong> — works out which pixels each triangle actually
          covers.</li>
        <li><strong>Texture units</strong> — fetch the image data for those pixels out of
          video memory.</li>
        <li><strong>Render operations</strong> — depth-test, blend and write the final
          colours.</li>
        <li><strong>Framebuffer</strong> — the finished image, handed to the display
          engine.</li>
      </ul>
      <GpuPipelineFigure />
      <p>
        Most of that is <strong>fixed-function hardware</strong>: you cannot rewrite the
        rasteriser, you can only program the shaders that run inside it. That is a
        deliberate trade — the fixed stages are fast and predictable, and the
        programmability is spent on the parts that genuinely need it.
      </p>

      <h2>The shader cores are where the parallelism lives</h2>
      <p>
        The programmable part of the GPU is the <strong>shader cores</strong>: thousands
        of small execution units, each applying a little arithmetic to a pixel or a
        vertex. A modern card has several thousand of them, all running at once. A CPU
        core is built to finish one complicated thing quickly; a shader core is built to
        finish a million simple things together. Neither is better — they are different
        machines.
      </p>
      <p>
        Vendors name these lanes differently. NVIDIA calls them{' '}
        <strong>CUDA cores</strong> and AMD calls them{' '}
        <strong>stream processors</strong>, but the names are not comparable across
        vendors: the two architectures are laid out differently, so “8,000 stream
        processors” is not better than “8,000 CUDA cores”. Do not compare them to each
        other, and do not compare a card's lane count to a CPU's core count either.
      </p>

      <h2>Ray tracing adds a second path, tensor cores a third</h2>
      <p>
        <strong>Ray tracing</strong> changes what the card has to do. Rather than shading
        each pixel once and deciding how bright it is, the card traces rays through the
        scene and asks what they hit — which means a great many extra lookups in the
        memory system, and a second, heavier path through the hardware. It looks better,
        and it costs noticeably more watts.
      </p>
      <p>
        <strong>Tensor cores</strong> are a different kind of accelerator: fixed-function
        units built for matrix multiplication, which is what a neural network does. They
        are what makes DLSS and FSR cheap enough to run on every frame. The useful detail
        for a power guide is that they are efficient at matrix work, not free.
      </p>

      <h2>Upscaling is a power lever</h2>
      <p>
        This is the part most people have backwards. DLSS and FSR do not just make a game
        look smoother — they render the frame at a{' '}
        <strong>lower internal resolution</strong> and reconstruct a larger image from it.
        Less shading work means less power, so turning upscaling on can bring a card's
        draw down noticeably for a small image quality trade.
      </p>
      <p>
        Frame generation is the opposite trade. It asks the card to produce extra frames
        rather than extra pixels, so the card does more work to give you a higher frame
        rate — it raises the frame rate and can raise the watts as well. If the bill is
        the priority, upscaling is the lever; frame generation is a choice about
        smoothness.
      </p>

      <h2>What actually sets the watts</h2>
      <p>
        A card's rated board power — the 450 W of an RTX 4090 — is a{' '}
        <strong>cap</strong>, not a setting. The card sits wherever the workload puts it
        and ramps towards that ceiling when there is enough work to do. The label tells
        you the worst case, not the everyday number.
      </p>
      <ul>
        <li><strong>Utilisation</strong> — a card busy at 30% is doing a fraction of the
          work and draws a fraction of the watts.</li>
        <li><strong>Resolution</strong> — 4K is four times the pixels of 1080p. In
          practice the same card in the same game at 4K often draws around twice what it
          drew at 1080p, because at 1080p the frame rate was usually held back by
          something other than the GPU and the card never ramped up.</li>
        <li><strong>The settings</strong> — ray tracing, heavy anti-aliasing and high
          resolutions are all more pixels to shade.</li>
        <li><strong>Frame rate limits</strong> — a card allowed to run at 500 fps on a
          60 Hz monitor is doing several times the work for the same picture.</li>
      </ul>
      <LoadCurveFigure />
      <p>
        The gap between the two ends of that curve is what makes a discrete card expensive
        to leave switched on. A card sitting at an idle desktop still pulls something in
        the 10–30 W range, for a picture that changes a few times a second. The{' '}
        <Link to="/guides/cutting-pc-power" className="text-brand-text underline underline-offset-2">
          guide to cutting PC power
        </Link>{' '}
        covers the levers;{' '}
        <Link to="/guides/what-each-component-draws" className="text-brand-text underline underline-offset-2">
          what each component draws
        </Link>{' '}
        has the per-part numbers.
      </p>

      <p>
        Add your card to the{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">calculator</Link>{' '}
        and it scales the card between its idle floor and its rated power using the
        utilisation you set, then converts that to wall draw. If the card is the part you
        are trying to make cheaper, the{' '}
        <Link to="/guides/vram-explained" className="text-brand-text underline underline-offset-2">
          VRAM guide
        </Link>{' '}
        explains what the card is doing with the memory that feeds it, and the{' '}
        <Link to="/guides/local-ai-power" className="text-brand-text underline underline-offset-2">
          local AI power guide
        </Link>{' '}
        covers the workload where the card never stops.
      </p>
    </>
  ),
};
