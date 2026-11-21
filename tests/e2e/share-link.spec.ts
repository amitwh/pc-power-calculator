import { expect, test, type Page } from '@playwright/test';

/**
 * The app prerenders every route and hydrates against that HTML with the
 * persisted build store deliberately *not* rehydrated yet (skipHydration).
 * These tests pin the consequence in a real browser: arriving with a share
 * link must not write the default build over the visitor's saved one, and the
 * hydrated page must not report a mismatch.
 */

const STORAGE_KEY = 'pc-power-builds';

interface StoredState {
  builds: Array<{ id: string; name: string; components: Record<string, unknown> }>;
  activeBuildId: string;
}

function savedBuild(id: string, name: string) {
  return {
    id,
    name,
    category: 'gaming',
    components: {},
    tdpOverrides: {},
    overclock: { cpu_pct: 0, gpu_pct: 0 },
    case_fans: 2,
    schedule: [],
    location: { country_iso2: 'IN' },
  };
}

/** What the Share button puts in `?builds=`: `{ build, customPeripherals }`, base64. */
function sharedLinkToken(buildName: string): string {
  const payload = {
    build: savedBuild('shared-build', buildName),
    customPeripherals: [],
  };
  // Mirrors src/lib/share/buildLink.ts: base64 of the JSON, URI-encoded. btoa
  // rather than Buffer so this file typechecks under the browser-ish tsconfig.
  return encodeURIComponent(btoa(JSON.stringify(payload)));
}

async function seedSavedBuilds(page: Page): Promise<void> {
  const state = {
    builds: [savedBuild('saved-a', 'My saved rig'), savedBuild('saved-b', 'Second rig')],
    activeBuildId: 'saved-a',
    customPeripherals: [],
  };
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify({ state, version: 1 })] as const,
  );
}

async function persisted(page: Page): Promise<StoredState | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw).state as StoredState) : null;
  }, STORAGE_KEY);
}

test('a ?builds= link keeps the saved builds and activates the import', async ({ page }) => {
  await seedSavedBuilds(page);
  await page.goto(`/?builds=${sharedLinkToken('Shared from a friend')}`);

  // The import happens after rehydration, so wait for it to land.
  await expect
    .poll(async () => (await persisted(page))?.builds.map((b) => b.name).join(' | '))
    .toContain('Shared from a friend');

  const state = (await persisted(page))!;
  // The regression: importing used to persist the default build over these.
  expect(state.builds.map((b) => b.name)).toEqual(
    expect.arrayContaining(['My saved rig', 'Second rig']),
  );
  expect(state.builds.find((b) => b.id === state.activeBuildId)?.name).toBe(
    'Shared from a friend',
  );
  // The token is stripped so a reload cannot import it twice.
  await expect(page).toHaveURL(/\/$/);
});

test('a ?part= link keeps the saved builds and adds the part to the active one', async ({
  page,
}) => {
  await seedSavedBuilds(page);
  await page.goto('/?part=gpu-nvidia-geforce-gt-1030');

  await expect
    .poll(async () => {
      const state = await persisted(page);
      const active = state?.builds.find((b) => b.id === state.activeBuildId);
      return active?.components.gpu;
    })
    .toBe('gpu-nvidia-geforce-gt-1030');

  const state = (await persisted(page))!;
  expect(state.builds.map((b) => b.name)).toEqual(
    expect.arrayContaining(['My saved rig', 'Second rig']),
  );
});

test('the prerendered home page hydrates without a mismatch', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Production React reports mismatches as "Minified React error #418/#423"
  // rather than readable text, so both forms are matched.
  const mismatches = errors.filter((e) =>
    /hydrat|did not match|server rendered|Minified React error #4(18|19|21|22|23)/i.test(e),
  );
  expect(mismatches).toEqual([]);
});
