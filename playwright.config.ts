import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

// Use the Playwright-managed Chromium when the exact revision this Playwright
// version asks for is downloaded; otherwise fall back to the system Chrome so
// the suite still runs on machines where the browser CDN is unreachable.
// Override with PW_CHANNEL. Checking the revision matters: a cache holding an
// older or newer chromium build still looks "installed" but cannot launch.
const browserCache = join(homedir(), '.cache', 'ms-playwright');

function bundledChromiumRevision(): string | undefined {
  try {
    const raw = readFileSync(
      join(process.cwd(), 'node_modules', 'playwright-core', 'browsers.json'),
      'utf8',
    );
    const { browsers } = JSON.parse(raw) as { browsers: Array<{ name: string; revision: string }> };
    return browsers.find((b) => b.name === 'chromium')?.revision;
  } catch {
    return undefined;
  }
}

const requiredRevision = bundledChromiumRevision();
const hasBundledChromium =
  requiredRevision !== undefined && existsSync(join(browserCache, `chromium-${requiredRevision}`));
const channel = process.env.PW_CHANNEL ?? (hasBundledChromium ? undefined : 'chrome');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
  },
  use: { baseURL: 'http://localhost:4173', ...(channel ? { channel } : {}) },
});
