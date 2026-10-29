import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BuildCategory, BuildConfig, ComponentSlot } from '@/types/build';
import type { WorkloadSchedule } from '@/types/workload';
import type { Component } from '@/types/component';

const generateId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Slots that hold several distinct components, each with its own unit count. */
const MULTI_SLOTS = new Set(['ram', 'storage', 'monitors', 'add_in_cards', 'optical_drives', 'peripherals', 'fans']);

/** Keep only finite integer unit counts ≥ 2 (1 is the implicit default). */
const sanitizeQuantities = (raw: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Math.round(Number(v));
    if (Number.isFinite(n) && n > 1) out[k] = Math.min(999, n);
  }
  return out;
};

const defaultBuild = (): BuildConfig => ({
  id: generateId(),
  name: 'My build',
  category: 'gaming',
  components: {},
  tdpOverrides: {},
  overclock: { cpu_pct: 0, gpu_pct: 0 },
  case_fans: 2,
  schedule: [
    { workload_id: 'gaming_1080p', hours_per_day: 0 },
    { workload_id: 'office', hours_per_day: 8 },
    { workload_id: 'browser', hours_per_day: 4 },
  ],
  location: { country_iso2: 'IN' },
});

const freshStore = () => {
  const first = defaultBuild();
  return { builds: [first], activeBuildId: first.id, customPeripherals: [] as Component[] };
};

export interface AddCustomPeripheralInput {
  brand: string;
  model: string;
  watts: number;
  subtype?: string;
}

interface BuildStore {
  builds: BuildConfig[];
  activeBuildId: string;
  customPeripherals: Component[];

  // CRUD on builds
  addBuild: (name?: string, category?: BuildCategory) => string;
  removeBuild: (id: string) => void;
  setActiveBuild: (id: string) => void;
  renameBuild: (id: string, name: string) => void;
  setBuildCategory: (id: string, category: BuildCategory) => void;

  // Active-build mutations
  setComponent: (slot: ComponentSlot, id: string | null) => void;
  /** Add a component to a slot — or, if it's already selected, bump its unit count. */
  addComponent: (slot: ComponentSlot, id: string) => void;
  /** Remove a component (and its unit count) from a slot. */
  removeComponent: (slot: ComponentSlot, id: string) => void;
  /** Set how many units of a selected component the build has (1–999; ≤1 clears). */
  setQty: (id: string, qty: number) => void;
  setSchedule: (schedule: WorkloadSchedule[]) => void;
  setLocation: (country: string, subdivision?: string) => void;
  setCurrency: (currency: string) => void;
  setManualRate: (rate: number | null) => void;
  setTdpOverride: (slot: string, watts: number | null) => void;
  /** Set CPU or GPU overclock percentage (0–50). */
  setOverclock: (part: 'cpu' | 'gpu', pct: number) => void;
  /** Set the case-fan count (0–20). */
  setCaseFans: (count: number) => void;

  // Custom peripherals (user-defined)
  addCustomPeripheral: (input: AddCustomPeripheralInput) => string;
  removeCustomPeripheral: (id: string) => void;

  // Whole-store reset + persistence helpers
  resetAll: () => void;
  exportBuild: () => string;
  importBuild: (json: string) => void;
}

const updateActive = (set: (fn: (s: BuildStore) => Partial<BuildStore>) => void, mutator: (b: BuildConfig) => BuildConfig) =>
  set((s) => {
    const idx = s.builds.findIndex((b) => b.id === s.activeBuildId);
    if (idx < 0) return {};
    const updated = mutator(s.builds[idx]);
    const builds = s.builds.slice();
    builds[idx] = updated;
    return { builds };
  });

export const useBuildStore = create<BuildStore>()(
  persist(
    (set, get) => ({
      ...freshStore(),

      addBuild: (name, category) => {
        const id = generateId();
        const build: BuildConfig = {
          ...defaultBuild(),
          id,
          name: name?.trim() || `Build ${get().builds.length + 1}`,
          category: category ?? 'general',
        };
        set((s) => ({ builds: [...s.builds, build], activeBuildId: id }));
        return id;
      },

      removeBuild: (id) =>
        set((s) => {
          // Always keep at least one build alive.
          if (s.builds.length <= 1) return {};
          const idx = s.builds.findIndex((b) => b.id === id);
          if (idx < 0) return {};
          const remaining = s.builds.filter((b) => b.id !== id);
          let activeBuildId = s.activeBuildId;
          if (s.activeBuildId === id) {
            // Promote the next build in list order, wrapping to the first if we
            // removed the tail. This is more intuitive than always going to [0].
            activeBuildId = remaining[idx % remaining.length].id;
          }
          // Drop peripherals attached to the removed build.
          const removed = s.builds[idx];
          const removedPeripheralIds = new Set(removed?.components.peripherals ?? []);
          const customPeripherals = removedPeripheralIds.size
            ? s.customPeripherals.filter((p) => !removedPeripheralIds.has(p.id))
            : s.customPeripherals;
          return { builds: remaining, activeBuildId, customPeripherals };
        }),

      setActiveBuild: (id) =>
        set((s) => (s.builds.some((b) => b.id === id) ? { activeBuildId: id } : {})),

      renameBuild: (id, name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return {};
          return {
            builds: s.builds.map((b) => (b.id === id ? { ...b, name: trimmed } : b)),
          };
        }),

      setBuildCategory: (id, category) =>
        set((s) => ({
          builds: s.builds.map((b) => (b.id === id ? { ...b, category } : b)),
        })),

      setComponent: (slot, id) =>
        updateActive(set, (b) => {
          const components = { ...b.components };
          if (id == null) {
            delete (components as Record<string, unknown>)[slot as string];
          } else {
            (components as Record<string, unknown>)[slot as string] = id;
          }
          return { ...b, components };
        }),

      // Normalize singular slot names ("monitor") to the plural keys actually used
      // by BuildComponents ("monitors"). The ComponentSlot type uses the singular
      // form so the public API stays readable.
      addComponent: (slot, id) =>
        updateActive(set, (b) => {
          const key = slot === 'monitor' ? 'monitors'
            : slot === 'add_in_card' ? 'add_in_cards'
            : slot === 'optical_drive' ? 'optical_drives'
            : slot === 'peripheral' ? 'peripherals'
            : slot;
          const arrKey = key as keyof typeof b.components;
          const quantities = { ...(b.quantities ?? {}) };
          const bump = () => {
            quantities[id] = Math.min(999, (quantities[id] ?? 1) + 1);
            return { ...b, quantities };
          };
          const isMultiSlot = Array.isArray(b.components[arrKey]) || MULTI_SLOTS.has(arrKey as string);
          if (isMultiSlot) {
            const existing = (b.components[arrKey] as unknown as string[] | undefined) ?? [];
            // Re-picking an already-selected device adds another unit of it.
            if (existing.includes(id)) return bump();
            return { ...b, components: { ...b.components, [arrKey]: [...existing, id] }, quantities };
          }
          // Single-instance slot: re-picking the same part bumps its unit
          // count (dual-socket / multi-GPU rigs); a different part replaces
          // it and resets the count to 1.
          const current = b.components[arrKey] as unknown as string | undefined;
          if (current === id) return bump();
          if (current) delete quantities[current];
          return { ...b, components: { ...b.components, [arrKey]: id }, quantities };
        }),

      removeComponent: (slot, id) =>
        updateActive(set, (b) => {
          const key = slot === 'monitor' ? 'monitors'
            : slot === 'add_in_card' ? 'add_in_cards'
            : slot === 'optical_drive' ? 'optical_drives'
            : slot === 'peripheral' ? 'peripherals'
            : slot;
          const arrKey = key as keyof typeof b.components;
          const quantities = { ...(b.quantities ?? {}) };
          // Single-instance slots (cpu, gpu, motherboard, psu, cooler, ups)
          // hold a plain string, not an array.
          if (!Array.isArray(b.components[arrKey])) {
            if ((b.components[arrKey] as unknown as string | undefined) !== id) return b;
            delete quantities[id];
            return { ...b, components: { ...b.components, [arrKey]: undefined }, quantities };
          }
          const existing = (b.components[arrKey] as unknown as string[] | undefined) ?? [];
          const next = existing.filter((x) => x !== id);
          if (next.length === existing.length) return b;
          delete quantities[id];
          return { ...b, components: { ...b.components, [arrKey]: next }, quantities };
        }),

      setQty: (id, qty) =>
        updateActive(set, (b) => {
          const n = Math.round(qty);
          const quantities = { ...(b.quantities ?? {}) };
          if (!Number.isFinite(n) || n <= 1) delete quantities[id];
          else quantities[id] = Math.min(999, n);
          return { ...b, quantities };
        }),

      setSchedule: (schedule) =>
        updateActive(set, (b) => ({ ...b, schedule: schedule.slice() as WorkloadSchedule[] })),

      setLocation: (country, subdivision) =>
        updateActive(set, (b) => ({
          ...b,
          location: { ...b.location, country_iso2: country, subdivision_code: subdivision },
        })),

      setCurrency: (currency) =>
        updateActive(set, (b) => ({ ...b, currency_override: currency })),

      setManualRate: (rate) =>
        updateActive(set, (b) => ({
          ...b,
          location: { ...b.location, manual_rate_override: rate ?? undefined },
        })),

      setTdpOverride: (slot, watts) =>
        updateActive(set, (b) => {
          const tdpOverrides = { ...b.tdpOverrides };
          if (watts == null || Number.isNaN(watts)) {
            delete tdpOverrides[slot];
          } else {
            tdpOverrides[slot] = watts;
          }
          return { ...b, tdpOverrides };
        }),

      setOverclock: (part, pct) =>
        updateActive(set, (b) => ({
          ...b,
          overclock: {
            cpu_pct: part === 'cpu' ? pct : b.overclock?.cpu_pct ?? 0,
            gpu_pct: part === 'gpu' ? pct : b.overclock?.gpu_pct ?? 0,
          },
        })),

      setCaseFans: (count) =>
        updateActive(set, (b) => ({ ...b, case_fans: Math.max(0, Math.min(20, Math.round(count))) })),

      addCustomPeripheral: (input) => {
        const id = `user-peripheral-${generateId()}`;
        const addedAt = new Date().toISOString();
        const entry: Component = {
          id,
          category: 'peripheral',
          brand: input.brand.trim() || 'Custom',
          model: input.model.trim() || 'Peripheral',
          releaseYear: new Date().getFullYear(),
          tdp_w: input.watts,
          specs: { watts: input.watts, ...(input.subtype ? { subtype: input.subtype } : {}) },
          source: 'user',
          addedAt,
        };
        set((s) => ({
          customPeripherals: [...s.customPeripherals, entry],
          builds: s.builds.map((b) =>
            b.id === s.activeBuildId
              ? {
                  ...b,
                  components: {
                    ...b.components,
                    peripherals: [...(b.components.peripherals ?? []), id],
                  },
                }
              : b,
          ),
        }));
        return id;
      },

      removeCustomPeripheral: (id) =>
        set((s) => ({
          customPeripherals: s.customPeripherals.filter((p) => p.id !== id),
          builds: s.builds.map((b) => ({
            ...b,
            components: {
              ...b.components,
              peripherals: (b.components.peripherals ?? []).filter((p) => p !== id),
            },
          })),
        })),

      resetAll: () => set(() => freshStore()),

      exportBuild: () => {
        const s = get();
        const build = s.builds.find((b) => b.id === s.activeBuildId);
        return JSON.stringify({
          version: 1,
          build,
          customPeripherals: s.customPeripherals.filter(
            (p) => build?.components.peripherals?.includes(p.id),
          ),
        });
      },

      importBuild: (json) => {
        const parsed = JSON.parse(json);
        if (parsed?.build) {
          const imported: BuildConfig = {
            ...parsed.build,
            id: generateId(),
            tdpOverrides: parsed.build.tdpOverrides ?? {},
            quantities: sanitizeQuantities(parsed.build.quantities),
            category: parsed.build.category ?? 'general',
          };
          set((s) => {
            const peripherals: Component[] = Array.isArray(parsed.customPeripherals)
              ? parsed.customPeripherals
              : [];
            return {
              builds: [...s.builds, imported],
              activeBuildId: imported.id,
              customPeripherals: [
                ...s.customPeripherals,
                ...peripherals.filter((p) => !s.customPeripherals.some((x) => x.id === p.id)),
              ],
            };
          });
        }
      },
    }),
    {
      name: 'pc-power-builds',
      version: 1,
    },
  ),
);
