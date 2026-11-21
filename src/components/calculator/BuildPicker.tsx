import { useId, useMemo, useState } from 'react';
import { listComponents, findComponent } from '@/lib/data/components';
import { useBuildStore } from '@/store/buildStore';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { CATEGORY_EMOJI, CATEGORY_LABEL } from '@/lib/buildCategory';
import { categoryColor } from '@/lib/categoryColors';
import type { BuildCategory, ComponentSlot } from '@/types/build';
import type { ComponentCategory, Component } from '@/types/component';

/** Catalog category → build slot it lands in when picked (canonical keys). */
const CATEGORY_TO_SLOT: Record<ComponentCategory, ComponentSlot> = {
  cpu: 'cpu',
  gpu: 'gpu',
  ram: 'ram',
  storage: 'storage',
  motherboard: 'motherboard',
  psu: 'psu',
  cooler: 'cooler',
  fan: 'fans',
  monitor: 'monitors',
  add_in_card: 'add_in_cards',
  optical_drive: 'optical_drives',
  ups: 'ups',
  peripheral: 'peripherals',
};

/** Display + iteration order for selected devices (tower → desk). */
const SLOT_ORDER: Array<{ key: ComponentSlot; category: ComponentCategory; label: string }> = [
  { key: 'cpu', category: 'cpu', label: 'CPU' },
  { key: 'gpu', category: 'gpu', label: 'GPU' },
  { key: 'motherboard', category: 'motherboard', label: 'Motherboard' },
  { key: 'cooler', category: 'cooler', label: 'Cooler' },
  { key: 'ram', category: 'ram', label: 'RAM' },
  { key: 'storage', category: 'storage', label: 'Storage' },
  { key: 'psu', category: 'psu', label: 'PSU' },
  { key: 'fans', category: 'fan', label: 'Fans' },
  { key: 'ups', category: 'ups', label: 'UPS' },
  { key: 'add_in_cards', category: 'add_in_card', label: 'Add-in' },
  { key: 'optical_drives', category: 'optical_drive', label: 'Optical' },
  { key: 'monitors', category: 'monitor', label: 'Monitor' },
  { key: 'peripherals', category: 'peripheral', label: 'Peripheral' },
];

const FILTER_OPTIONS: Array<{ value: ComponentCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All categories' },
  { value: 'cpu', label: 'CPU' },
  { value: 'gpu', label: 'GPU' },
  { value: 'motherboard', label: 'Motherboard' },
  { value: 'ram', label: 'RAM' },
  { value: 'storage', label: 'Storage' },
  { value: 'psu', label: 'PSU' },
  { value: 'cooler', label: 'Cooler' },
  { value: 'fan', label: 'Case fan' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'optical_drive', label: 'Optical drive' },
  { value: 'add_in_card', label: 'Add-in card' },
  { value: 'ups', label: 'UPS' },
  { value: 'peripheral', label: 'Peripheral' },
];

const CATEGORIES: BuildCategory[] = ['gaming', 'workstation', 'nas', 'ai', 'general'];

/** One selected device: the component + which slot it occupies. */
interface SelectedDevice {
  component: Component;
  slot: ComponentSlot;
  qty: number;
}

const SLOT_LABEL_BY_KEY = new Map(SLOT_ORDER.map((s) => [s.key, s.label]));

export function BuildPicker() {
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const customPeripherals = useBuildStore((s) => s.customPeripherals);
  const addComponent = useBuildStore((s) => s.addComponent);
  const removeComponent = useBuildStore((s) => s.removeComponent);
  const setQty = useBuildStore((s) => s.setQty);
  const setTdpOverride = useBuildStore((s) => s.setTdpOverride);
  const setOverclock = useBuildStore((s) => s.setOverclock);
  const setCaseFans = useBuildStore((s) => s.setCaseFans);
  const addCustomPeripheral = useBuildStore((s) => s.addCustomPeripheral);
  const removeCustomPeripheral = useBuildStore((s) => s.removeCustomPeripheral);
  const setBuildCategory = useBuildStore((s) => s.setBuildCategory);

  const activeBuild = builds.find((b) => b.id === activeBuildId);

  // Stable, server/client-consistent ids for the advanced-input labels. The
  // build id is generated per client and differs from the prerendered HTML's
  // id, so deriving DOM ids from it would break hydration.
  const fieldId = useId();

  const [filter, setFilter] = useState<ComponentCategory | 'all'>('all');

  // The one picker: whole catalog, newest first, category-filterable.
  const options = useMemo(() => {
    const pool = filter === 'all' ? listComponents() : listComponents(filter);
    return pool
      .slice()
      .sort((a, b) => b.releaseYear - a.releaseYear || a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))
      .map((c) => ({
        value: c.id,
        label: `${c.brand} ${c.model} · ${SLOT_LABEL_BY_KEY.get(CATEGORY_TO_SLOT[c.category]) ?? c.category} (${c.tdp_w ?? '?'} W)`,
        meta: { brand: c.brand, year: c.releaseYear, tdp_w: c.tdp_w },
      }));
  }, [filter]);

  const resolveById = (id: string): Component | undefined =>
    findComponent(id) ?? customPeripherals.find((p) => p.id === id);

  // Every selected device across all slots, in tower → desk order.
  const devices: SelectedDevice[] = useMemo(() => {
    if (!activeBuild) return [];
    const out: SelectedDevice[] = [];
    const quantities = activeBuild.quantities ?? {};
    for (const slot of SLOT_ORDER) {
      const slotValue = activeBuild.components[slot.key as 'cpu'];
      const ids = Array.isArray(slotValue) ? slotValue : slotValue ? [slotValue as string] : [];
      for (const id of ids) {
        const component = resolveById(id);
        if (component) out.push({ component, slot: slot.key, qty: Math.max(1, Math.round(quantities[id] ?? 1)) });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBuild, customPeripherals]);

  if (!activeBuild) {
    return (
      <Card className="p-3">
        <CardTitle className="text-base">Parts</CardTitle>
        <p className="text-sm text-gray-500">No system selected.</p>
      </Card>
    );
  }

  const effectiveW = (d: SelectedDevice): number | null =>
    activeBuild.tdpOverrides[d.component.id]
    ?? activeBuild.tdpOverrides[d.slot]
    ?? d.component.tdp_w
    ?? d.component.specs.watts as number | undefined
    ?? null;

  return (
    <Card className="p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold">Parts</h2>
        {devices.length > 0 && (
          <span className="text-xs text-gray-500 font-numeric tabular-nums">
            {devices.length} device{devices.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* System type, catalog filter and the picker in ONE row: three controls
          that used to occupy two stacked rows plus their own card. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,8.5rem)_minmax(0,9rem)_minmax(0,1fr)]">
        <Select
          aria-label="System type"
          className="!min-h-9 !text-sm"
          value={activeBuild.category ?? 'general'}
          options={CATEGORIES.map((c) => ({ value: c, label: `${CATEGORY_EMOJI[c]} ${CATEGORY_LABEL[c]}` }))}
          onChange={(e) => setBuildCategory(activeBuild.id, e.target.value as BuildCategory)}
        />
        <Select
          aria-label="Filter parts by category"
          className="!min-h-9 !text-sm"
          value={filter}
          options={FILTER_OPTIONS}
          onChange={(e) => setFilter(e.target.value as ComponentCategory | 'all')}
        />
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <SearchableSelect
            ariaLabel="Add device"
            compact
            placeholder="+ Add a part — search 2,200+…"
            value=""
            options={options}
            onChange={(v) => {
              if (!v) return;
              const component = findComponent(v);
              if (!component) return;
              addComponent(CATEGORY_TO_SLOT[component.category], v);
            }}
            brandFilter={false}
          />
        </div>
      </div>

      {/* Selected devices — one 36 px line each: name, rated W, units, total. */}
      {devices.length > 0 && (
        <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
          {devices.map((d) => {
            const name = `${d.component.brand} ${d.component.model}`;
            const w = effectiveW(d);
            const overridden = activeBuild.tdpOverrides[d.component.id] != null
              || activeBuild.tdpOverrides[d.slot] != null;
            const col = categoryColor(d.component.category);
            return (
              <li
                key={`${d.slot}:${d.component.id}`}
                className={`flex flex-wrap items-center gap-x-2 gap-y-1 py-1 pl-1.5 border-l-[3px] ${col.bar} text-sm`}
              >
                <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                  <span className="block truncate font-medium text-gray-900 dark:text-gray-50" title={name}>
                    {name}
                  </span>
                </span>
                <span className="ml-auto flex items-center gap-2">
                <span className="flex shrink-0 items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1}
                    defaultValue={w ?? ''}
                    key={`${d.component.id}-w-${w ?? 'na'}`}
                    aria-label={`Rated watts for ${name}`}
                    title="Rated watts per unit"
                    className="w-14 h-8 px-1 text-right rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = v === '' ? null : Number(v);
                      setTdpOverride(d.component.id, n != null && Number.isFinite(n) && n !== d.component.tdp_w ? n : null);
                      setTdpOverride(d.slot, null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                  />
                  <span aria-hidden className="text-xs text-gray-500">W</span>
                  {overridden && (
                    <button
                      type="button"
                      aria-label={`Reset wattage for ${name}`}
                      title="Reset to catalog rating"
                      className="h-8 w-5 text-sm opacity-60 hover:opacity-100"
                      onClick={() => {
                        setTdpOverride(d.component.id, null);
                        setTdpOverride(d.slot, null);
                      }}
                    >
                      ↺
                    </button>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1" role="group" aria-label={`Units of ${name}`}>
                  <button
                    type="button"
                    aria-label={`Decrease quantity for ${name}`}
                    disabled={d.qty <= 1}
                    className="h-8 w-7 rounded-8 border border-gray-300 dark:border-gray-700 text-base leading-none opacity-80 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => setQty(d.component.id, d.qty - 1)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={999}
                    step={1}
                    value={d.qty}
                    aria-label={`Quantity for ${name}`}
                    className="w-10 h-8 px-0.5 text-center rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n) && n >= 1) setQty(d.component.id, n);
                    }}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n) || n < 1) setQty(d.component.id, 1);
                    }}
                  />
                  <button
                    type="button"
                    aria-label={`Increase quantity for ${name}`}
                    className="h-8 w-7 rounded-8 border border-gray-300 dark:border-gray-700 text-base leading-none opacity-80 hover:opacity-100"
                    onClick={() => setQty(d.component.id, d.qty + 1)}
                  >
                    +
                  </button>
                </span>
                {/* A PSU's wattage is capacity, not draw — the engine reports 0
                    and "0 W" in a total column reads as a bug, so show a dash. */}
                <span className="w-14 shrink-0 text-right font-numeric tabular-nums font-semibold" title="Subtotal for all units">
                  {w != null && w > 0 ? `${Math.round(w * d.qty)} W` : '—'}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  className="h-8 w-7 shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
                  onClick={() => {
                    removeComponent(d.slot, d.component.id);
                    if (d.component.id.startsWith('user-peripheral-')) removeCustomPeripheral(d.component.id);
                  }}
                >
                  ×
                </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Overclocking, case fans and custom devices — one collapsed group. */}
      <details className="mt-2">
        <summary className="cursor-pointer select-none text-xs font-semibold text-gray-500">
          Advanced — overclock, case fans, custom device
        </summary>
        <div className="mt-2 space-y-2">
          <div className="space-y-1">
            {([
              { part: 'cpu' as const, label: 'CPU OC' },
              { part: 'gpu' as const, label: 'GPU OC' },
            ]).map(({ part, label }) => {
              const value = activeBuild.overclock?.[`${part}_pct` as 'cpu_pct' | 'gpu_pct'] ?? 0;
              const id = `oc-${part}-${fieldId}`;
              return (
                <div key={part} className="flex items-center gap-2">
                  <label htmlFor={id} className="text-sm text-gray-600 dark:text-gray-400 w-20 shrink-0">
                    {label}
                  </label>
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={50}
                    step={5}
                    value={value}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) setOverclock(part, Math.max(0, Math.min(50, n)));
                    }}
                    className="w-20 min-h-9 px-2 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              );
            })}
            {(() => {
              const fans = activeBuild.case_fans ?? 0;
              const id = `case-fans-${fieldId}`;
              return (
                <div className="flex items-center gap-2">
                  <label htmlFor={id} className="text-sm text-gray-600 dark:text-gray-400 w-20 shrink-0">
                    Case fans
                  </label>
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={12}
                    step={1}
                    value={Math.min(fans, 12)}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) setCaseFans(Math.max(0, Math.min(12, n)));
                    }}
                    className="w-20 min-h-9 px-2 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
                  />
                  <span className="text-xs text-gray-500">fans</span>
                </div>
              );
            })()}
          </div>
          <p className="text-xs text-gray-500">
            Overclock adds extra heat on top of the rated TDP; each fan ≈ 2 W.
          </p>

          {/* Custom device — anything not in the catalog */}
          <CustomDeviceForm onAdd={(model, watts) => addCustomPeripheral({ brand: 'Custom', model, watts })} />
        </div>
      </details>
    </Card>
  );
}

function CustomDeviceForm({ onAdd }: { onAdd: (model: string, watts: number) => void }) {
  const [model, setModel] = useState('');
  const [watts, setWatts] = useState('');

  const submit = () => {
    const w = Number(watts);
    const name = model.trim();
    if (!name || !Number.isFinite(w) || w <= 0) return;
    onAdd(name, w);
    setModel('');
    setWatts('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        placeholder="Custom device (e.g. Desk lamp)"
        aria-label="Custom device name"
        className="flex-1 min-w-[160px] min-h-9 px-3 rounded-8 border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-body text-sm"
      />
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.5}
        value={watts}
        onChange={(e) => setWatts(e.target.value)}
        placeholder="Watts"
        aria-label="Custom device wattage"
        className="w-24 min-h-9 px-3 rounded-8 border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
      />
      <Button size="sm" variant="secondary" onClick={submit} disabled={!model.trim() || !(Number(watts) > 0)}>
        Add
      </Button>
    </div>
  );
}
