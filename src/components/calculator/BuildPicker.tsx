import { useId, useMemo, useState } from 'react';
import { listComponents, findComponent } from '@/lib/data/components';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CATEGORY_LABEL } from '@/lib/buildCategory';
import { categoryColor } from '@/lib/categoryColors';
import { confidenceFor } from '@/lib/data/confidence';
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

const CATEGORIES: BuildCategory[] = [
  'general',
  'gaming',
  'content',
  'workstation',
  'ai',
  'homelab',
  'nas',
  'web',
  'database',
];

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
  const { peakWallDrawW, recommendedPsuW } = useCalc();

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
      <Card>
        <h2 className="font-display text-base font-bold">Your system</h2>
        <p className="mt-2 text-sm text-gray-500">No system selected.</p>
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
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <h2 className="font-display text-base font-bold">Your system</h2>
        <span className="flex flex-wrap items-baseline gap-x-1.5 font-numeric text-xs tabular-nums text-gray-500">
          {devices.length > 0 && (
            <>
              <span>{devices.length} part{devices.length === 1 ? '' : 's'}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>peak {Math.round(peakWallDrawW)} W</span>
          {devices.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>PSU {recommendedPsuW} W</span>
            </>
          )}
        </span>
      </div>

      {/* Rows read as a spec list — dot, name, watts. The editable controls are
          there but only surface on hover or keyboard focus, so the card stays
          calm at rest; on touch they stay visible. */}
      {devices.length > 0 ? (
        <ul className="group/list mt-2">
          {devices.map((d) => {
            const name = `${d.component.brand} ${d.component.model}`;
            const w = effectiveW(d);
            const overridden = activeBuild.tdpOverrides[d.component.id] != null
              || activeBuild.tdpOverrides[d.slot] != null;
            const hex = categoryColor(d.component.category).hex;
            return (
              <li
                key={`${d.slot}:${d.component.id}`}
                className="group flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-gray-100 py-1.5 text-sm last:border-b-0 dark:border-gray-800"
              >
                <i
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: hex }}
                  aria-hidden
                  title={SLOT_LABEL_BY_KEY.get(d.slot)}
                />
                <span
                  className="min-w-0 flex-1 basis-full truncate font-semibold text-gray-900 dark:text-gray-50 sm:basis-auto"
                  title={name}
                >
                  {name}
                </span>

                <span className="ml-auto flex shrink-0 items-center gap-1 transition-opacity sm:ml-0 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1}
                    defaultValue={w ?? ''}
                    key={`${d.component.id}-w-${w ?? 'na'}`}
                    aria-label={`Rated watts for ${name}`}
                    title="Rated watts per unit — edit only if it differs from the catalog"
                    className="h-6 w-12 rounded-4 border border-gray-300 bg-white px-1 text-right font-numeric text-xs tabular-nums dark:border-gray-700 dark:bg-gray-900"
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
                  <span role="group" aria-label={`Quantity for ${name}`} className="flex items-center">
                    <button
                      type="button"
                      aria-label={`Decrease quantity for ${name}`}
                      disabled={d.qty <= 1}
                      onClick={() => setQty(d.component.id, d.qty - 1)}
                      className="h-6 w-5 rounded-4 text-sm leading-none text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-numeric text-xs tabular-nums">{d.qty}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity for ${name}`}
                      onClick={() => setQty(d.component.id, d.qty + 1)}
                      className="h-6 w-5 rounded-4 text-sm leading-none text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      +
                    </button>
                  </span>
                  {overridden && (
                    <button
                      type="button"
                      aria-label={`Reset wattage for ${name}`}
                      title="Reset to catalog rating"
                      onClick={() => {
                        setTdpOverride(d.component.id, null);
                        setTdpOverride(d.slot, null);
                      }}
                      className="h-6 w-4 text-xs text-gray-500 hover:text-gray-900"
                    >
                      ↺
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => {
                      removeComponent(d.slot, d.component.id);
                      if (d.component.id.startsWith('user-peripheral-')) removeCustomPeripheral(d.component.id);
                    }}
                    className="h-6 w-5 text-base leading-none text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    ×
                  </button>
                </span>

                <span
                  className="w-12 shrink-0 text-right font-numeric text-sm font-semibold tabular-nums"
                  title={`${confidenceFor(d.component.source).label} · ${d.component.source}`}
                >
                  {w != null && w > 0 ? `${Math.round(w * d.qty)} W` : '—'}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          Nothing added yet — pick a part below and the cost starts moving.
        </p>
      )}

      {/* One picker, at the foot of the card where the mockup puts it. */}
      <div className="mt-3 grid grid-cols-1 gap-2">
        <Select
          aria-label="Use case"
          className="!min-h-9 !text-sm"
          value={activeBuild.category ?? 'general'}
          options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
          onChange={(e) => setBuildCategory(activeBuild.id, e.target.value as BuildCategory)}
        />
        <Select
          aria-label="Filter parts by category"
          className="!min-h-9 !text-sm"
          value={filter}
          options={FILTER_OPTIONS}
          onChange={(e) => setFilter(e.target.value as ComponentCategory | 'all')}
        />
      </div>
      <div className="mt-2">
        <SearchableSelect
          ariaLabel="Add a part"
          placeholder="+ Add a part — search 2,200+ parts"
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

      {/* Overclocking, case fans and custom devices — one collapsed group. */}
      <details className="mt-3">
        <summary className="cursor-pointer select-none text-xs font-semibold text-gray-500">
          Advanced
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
                  <label htmlFor={id} className="w-20 shrink-0 text-sm text-gray-600 dark:text-gray-400">
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
                    className="h-8 w-20 rounded-8 border border-gray-300 bg-white px-2 font-numeric text-sm tabular-nums dark:border-gray-700 dark:bg-gray-900"
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
                  <label htmlFor={id} className="w-20 shrink-0 text-sm text-gray-600 dark:text-gray-400">
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
                    className="h-8 w-20 rounded-8 border border-gray-300 bg-white px-2 font-numeric text-sm tabular-nums dark:border-gray-700 dark:bg-gray-900"
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
        className="min-h-9 min-w-[160px] flex-1 rounded-8 border border-dashed border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
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
        className="min-h-9 w-24 rounded-8 border border-dashed border-gray-300 bg-white px-3 font-numeric text-sm tabular-nums dark:border-gray-700 dark:bg-gray-900"
      />
      <Button size="sm" variant="secondary" onClick={submit} disabled={!model.trim() || !(Number(watts) > 0)}>
        Add
      </Button>
    </div>
  );
}
