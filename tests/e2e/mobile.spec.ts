import { devices, expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * The mobile layout guard.
 *
 * Why Pixel 5 rather than iPhone 13: the iPhone descriptor is WebKit, and the
 * WebKit browser is not installed on this machine, so the whole file would
 * fail to launch. The browser is named explicitly because playwright.config.ts
 * falls back to the system Chrome when the bundled Chromium revision is
 * missing — a named browser keeps the launch working on either machine.
 *
 * Why a device profile at all: a desktop viewport has room for a classic
 * scrollbar and the wide layouts the app is designed for. The Pixel 5 profile
 * is a true mobile viewport, so `clientWidth` is the screen width and any
 * element past the right edge is a real overflow on a phone.
 */
const PIXEL_5 = devices['Pixel 5'];

// `defaultBrowserType` is dropped on purpose — Playwright refuses it in a
// `test.use()` call, and `browserName` below names the browser instead.
const { defaultBrowserType: _dropped, ...pixel5 } = PIXEL_5;

// Top level, not inside a describe: `browserName` forces a new worker, and
// Playwright only allows that at the top level of the file.
test.use({ ...pixel5, browserName: 'chromium' });

const ROUTES = [
  '/',
  '/compare',
  '/guides',
  '/guides/psu-sizing',
  '/help',
  '/open-source',
  '/about',
  '/privacy',
  '/data',
  '/suggest',
  '/feedback',
  '/cost/in/mh',
  '/parts/gpu-amd-rx-6400',
  '/suggestions',
];

interface Overflow {
  scrollWidth: number;
  clientWidth: number;
  offenders: string[];
}

/**
 * Measure the page and, when it is too wide, name the elements responsible.
 *
 * Why the clipping filter: the heroes carry a decorative blur blob that sits
 * past the right edge on purpose, inside an `overflow-hidden` section. It
 * produces no scrollbar, so listing it would point the reader at the wrong
 * thing. Only elements that nothing above them clips can push the page
 * sideways.
 */
async function measureOverflow(page: Page): Promise<Overflow> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const clientWidth = doc.clientWidth;

    const isClipped = (el: Element): boolean => {
      let parent = el.parentElement;
      while (parent) {
        if (getComputedStyle(parent).overflowX !== 'visible') return true;
        parent = parent.parentElement;
      }
      return false;
    };

    const offenders: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.right <= clientWidth + 1) continue;
      if (isClipped(el)) continue;
      const tag = el.tagName.toLowerCase();
      const cls = el.getAttribute('class') ?? '';
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
      offenders.push(
        `<${tag}${cls ? ` class="${cls}"` : ''}> "${text}" (width=${Math.round(rect.width)}px, right=${Math.round(rect.right)}px)`,
      );
    }

    // The worst offender first: an element wider than the screen is the
    // culprit, while a full-width element that merely got stretched by it is
    // a victim.
    offenders.sort((a, b) => {
      const width = (s: string) => Number(/width=(-?\d+)px/.exec(s)?.[1] ?? 0);
      const right = (s: string) => Number(/right=(-?\d+)px/.exec(s)?.[1] ?? 0);
      const wide = Number(width(a) > clientWidth) - Number(width(b) > clientWidth);
      return wide !== 0 ? -wide : right(b) - right(a);
    });

    return { scrollWidth: doc.scrollWidth, clientWidth, offenders: offenders.slice(0, 8) };
  });
}

function registerOverflowTests(): void {
  for (const path of ROUTES) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      // Wait for the route to render before measuring — otherwise the check
      // can run against a half-painted page and pass for the wrong reason.
      await page.waitForLoadState('networkidle');

      const { scrollWidth, clientWidth, offenders } = await measureOverflow(page);
      const detail = offenders.length
        ? `\nElements past the right edge:\n${offenders.map((o) => `  ${o}`).join('\n')}`
        : '\nNo unclipped element was found past the right edge — the overflow is on the root element itself.';

      expect(
        scrollWidth,
        `Horizontal overflow on ${path}: scrollWidth ${scrollWidth}px > clientWidth ${clientWidth}px.${detail}`,
      ).toBeLessThanOrEqual(clientWidth);
    });
  }
}

test.describe('mobile — Pixel 5 preset', () => {
  registerOverflowTests();
});

test.describe('mobile — 320px', () => {
  test.use({ viewport: { width: 320, height: 780 } });
  registerOverflowTests();
});

test.describe('mobile — 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  registerOverflowTests();
});
