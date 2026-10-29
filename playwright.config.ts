import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

// Use the Playwright-managed Chromium when it has been downloaded; otherwise
// fall back to the system Chrome so the suite still runs on machines where
// the Playwright browser CDN is unreachable. Override with PW_CHANNEL.
const browserCache = join(homedir(), '.cache', 'ms-playwright');
const hasBundledChromium =
  existsSync(browserCache) &&
  readdirSync(browserCache).some((d) => d.startsWith('chromium'));
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
