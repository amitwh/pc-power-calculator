import type { Component, ComponentCategory } from '@/types/component';

// The catalog lives in its own code-split chunk (it is 1–2 MB of JSON), so it
// must NOT be imported statically anywhere — `initCatalog()` fetches it once
// at app bootstrap and the sync accessors below serve from memory afterwards.
let all: Component[] = [];
let meta: { version: string; lastUpdated: string } = { version: '', lastUpdated: '' };

/** Load the hardware catalog chunk. Await once at app bootstrap before render. */
export async function initCatalog(): Promise<void> {
  if (all.length > 0) return;
  const mod = await import('@/data/components.json');
  const data = mod.default as unknown as {
    components: Component[];
    version: string;
    lastUpdated: string;
  };
  all = data.components;
  meta = { version: data.version, lastUpdated: data.lastUpdated };
}

/** Test-only: seed the catalog synchronously (vitest setup does this). */
export function __setCatalogForTests(data: {
  components: Component[];
  version: string;
  lastUpdated: string;
}): void {
  all = data.components;
  meta = { version: data.version, lastUpdated: data.lastUpdated };
}

export function catalogSize(): number {
  return all.length;
}

export function listComponents(category?: ComponentCategory): Component[] {
  return category ? all.filter((c) => c.category === category) : all;
}

export function findComponent(id: string): Component | undefined {
  return all.find((c) => c.id === id);
}

export function dataVersion(): string {
  return meta.version;
}

export function dataLastUpdated(): string {
  return meta.lastUpdated;
}
