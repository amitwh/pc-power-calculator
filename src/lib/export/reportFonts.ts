import { Font } from '@react-pdf/renderer';

/**
 * Font families used by the PDF report. The numeric face is monospaced so
 * columns of figures line up and every glyph in Indian currency formatting
 * (₹, ₹ lakh grouping, ₂ in CO₂e) comes from the embedded file rather than a
 * viewer fallback.
 */
export const REPORT_FONT_FAMILIES = {
  body: 'Inter',
  numeric: 'JetBrains Mono',
} as const;

let registered = false;

/**
 * Register the report's embedded faces with react-pdf.
 *
 * `base` is the public URL prefix in the browser (`/fonts/report`) and an
 * absolute filesystem path in tests. Registration is idempotent: the renderer
 * keeps one global font registry per process.
 */
export function registerReportFonts(base: string): void {
  if (registered) return;

  Font.register({
    family: REPORT_FONT_FAMILIES.body,
    fonts: [
      { src: `${base}/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/Inter-SemiBold.ttf`, fontWeight: 600 },
      { src: `${base}/Inter-Bold.ttf`, fontWeight: 700 },
    ],
  });

  Font.register({
    family: REPORT_FONT_FAMILIES.numeric,
    fonts: [{ src: `${base}/JetBrainsMono-Regular.ttf`, fontWeight: 400 }],
  });

  registered = true;
}
