import { useMemo, useState } from 'react';
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
  const addBuild = useBuildStore((s) => s.addBuild);
  const removeBuild = useBuildStore((s) => s.removeBuild);
  const setActiveBuild = useBuildStore((s) => s.setActiveBuild);
  const renameBuild = useBuildStore((s) => s.renameBuild);
  const setBuildCategory = useBuildStore((s) => s.setBuildCategory);

  const activeBuild = builds.find((b) => b.id === activeBuildId);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
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
        <CardTitle>Your Systems</CardTitle>
        <Button onClick={() => addBuild('My build', 'gaming')}>+ Add system</Button>
      </Card>
    );
  }

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setRenameDraft(current);
  };

  const commitRename = () => {
    if (renamingId) {
      renameBuild(renamingId, renameDraft);
      setRenamingId(null);
    }
  };

  const effectiveW = (d: SelectedDevice): number | null =>
    activeBuild.tdpOverrides[d.component.id]
    ?? activeBuild.tdpOverrides[d.slot]
    ?? d.component.tdp_w
    ?? d.component.specs.watts as number | undefined
    ?? null;

  return (
    <Card>
      <CardTitle>
        <span>Your Systems</span>
        <span className="font-body text-sm font-normal text-gray-500 font-numeric tabular-nums">
          {devices.length} device{devices.length === 1 ? '' : 's'}
        </span>
      </CardTitle>

      {/* System selector chips.
          Using role="group" (not tablist) because each chip contains its own
          interactive controls (switch + remove + rename). tablist would require
          each direct child to be a single tab role with no nested interactive
          content — these chips are pickers, not tabs. */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1"
        role="group"
        aria-label="Build systems"
      >
        {builds.map((b) => {
          const isActive = b.id === activeBuildId;
          const isRenaming = renamingId === b.id;
          const emoji = CATEGORY_EMOJI[b.category ?? 'general'];
          return (
            <div
              key={b.id}
              aria-current={isActive ? 'true' : undefined}
              className={`group inline-flex items-center gap-2 rounded-full border pl-3 pr-2.5 py-1.5 min-h-[40px] whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-dark text-white border-brand-dark'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <span aria-hidden className="text-sm leading-none">
                {emoji}
              </span>
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="bg-transparent border-none outline-none font-semibold text-sm min-w-[80px]"
                  aria-label="Rename build"
                />
              ) : (
                <button
                  type="button"
                  className="font-semibold text-sm"
                  onClick={() => setActiveBuild(b.id)}
                  onDoubleClick={() => startRename(b.id, b.name)}
                  title="Click to switch; double-click to rename"
                >
                  {b.name}
                </button>
              )}
              {builds.length > 1 && !isRenaming && (
                <button
                  type="button"
                  aria-label={`Remove ${b.name}`}
                  className={`text-base leading-none opacity-70 hover:opacity-100 ${isActive ? 'text-white' : 'text-gray-700'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove "${b.name}"?`)) removeBuild(b.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* Add-system chip with dashed border */}
        <button
          type="button"
          onClick={() => addBuild(undefined, 'general')}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-400 dark:border-gray-600 px-3 py-1.5 min-h-[40px] whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-brand-dark hover:text-brand-dark transition-colors"
        >
          + Add system
        </button>
      </div>

      {/* System type + catalog filter — native selects: one row, thumb-friendly */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Select
          aria-label="System type"
          value={activeBuild.category ?? 'general'}
          options={CATEGORIES.map((c) => ({ value: c, label: `${CATEGORY_EMOJI[c]} ${CATEGORY_LABEL[c]}` }))}
          onChange={(e) => setBuildCategory(activeBuild.id, e.target.value as BuildCategory)}
        />
        <Select
          aria-label="Filter parts by category"
          value={filter}
          options={FILTER_OPTIONS}
          onChange={(e) => setFilter(e.target.value as ComponentCategory | 'all')}
        />
      </div>

      {/* The one device picker — whole catalog, filtered by category select */}
      <div className="mb-3">
        <SearchableSelect
          ariaLabel="Add device"
          placeholder="+ Add device — search 2,200+ parts, pick again to add another unit"
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

      {/* Selected devices — cart rows with per-device unit counts */}
      {devices.length === 0 ? (
        <p className="text-sm text-gray-500 py-3">
          No devices yet — search above to add your first part.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800 border-y border-gray-100 dark:border-gray-800">
          {devices.map((d) => {
            const name = `${d.component.brand} ${d.component.model}`;
            const w = effectiveW(d);
            const overridden = activeBuild.tdpOverrides[d.component.id] != null
              || activeBuild.tdpOverrides[d.slot] != null;
            const col = categoryColor(d.component.category);
            return (
              <li key={`${d.slot}:${d.component.id}`} className={`py-2 pl-1.5 border-l-[3px] ${col.bar} flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm`}>
                <span className="flex items-center gap-2 min-w-0 flex-1 basis-full sm:basis-auto">
                  <span
                    aria-hidden
                    title={SLOT_LABEL_BY_KEY.get(d.slot)}
                    className={`flex w-7 h-7 items-center justify-center rounded-lg text-sm shrink-0 ${col.badge}`}
                  >
                    {d.component.category === 'cpu' ? '🧠'
                      : d.component.category === 'gpu' ? '🎮'
                      : d.component.category === 'monitor' ? '🖥️'
                      : d.component.category === 'psu' ? '🔌'
                      : d.component.category === 'storage' ? '💾'
                      : d.component.category === 'ram' ? '🧩'
                      : d.component.category === 'fan' ? '🌀'
                      : '⚙️'}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900 dark:text-gray-50" title={name}>
                      {name}
                    </span>
                    <span className={`block text-xs font-semibold ${col.badge.split(' ').filter((c) => c.startsWith('text-')).join(' ')}`}>
                      {SLOT_LABEL_BY_KEY.get(d.slot)}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2 ml-auto">
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={1}
                      defaultValue={w ?? ''}
                      key={`${d.component.id}-w-${w ?? 'na'}`}
                      aria-label={`Rated watts for ${name}`}
                      title="Rated watts per unit"
                      className="w-16 min-h-[36px] px-1.5 text-right rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
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
                        className="text-sm opacity-60 hover:opacity-100 min-h-[32px] min-w-[28px]"
                        onClick={() => {
                          setTdpOverride(d.component.id, null);
                          setTdpOverride(d.slot, null);
                        }}
                      >
                        ↺
                      </button>
                    )}
                  </span>
                  <span className="flex items-center gap-1" role="group" aria-label={`Units of ${name}`}>
                    <button
                      type="button"
                      aria-label={`Decrease quantity for ${name}`}
                      disabled={d.qty <= 1}
                      className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 text-base leading-none opacity-80 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
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
                      className="w-12 min-h-[36px] px-0.5 text-center rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
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
                      className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 text-base leading-none opacity-80 hover:opacity-100"
                      onClick={() => setQty(d.component.id, d.qty + 1)}
                    >
                      +
                    </button>
                  </span>
                  <span className="w-16 text-right font-numeric tabular-nums font-semibold" title="Subtotal for all units">
                    {w != null ? `${Math.round(w * d.qty)} W` : '—'}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    className="text-lg leading-none opacity-60 hover:opacity-100 min-h-[36px] min-w-[28px]"
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

      {/* Overclocking + case fans — collapsed by default to keep the card tight */}
      <details className="mt-3 group">
        <summary className="cursor-pointer select-none text-xs uppercase tracking-wide text-gray-500 font-semibold">
          Overclocking &amp; chassis fans
          <span className="ml-2 font-normal normal-case tracking-normal text-gray-500 group-open:hidden">
            (CPU/GPU OC, fan count)
          </span>
        </summary>
        <div className="mt-2 space-y-1">
          {([
            { part: 'cpu' as const, label: 'CPU OC' },
            { part: 'gpu' as const, label: 'GPU OC' },
          ]).map(({ part, label }) => {
            const value = activeBuild.overclock?.[`${part}_pct` as 'cpu_pct' | 'gpu_pct'] ?? 0;
            const id = `oc-${part}-${activeBuild.id}`;
            return (
              <div key={part} className="flex items-center gap-3">
                <label htmlFor={id} className="text-sm text-gray-600 dark:text-gray-400 w-20 shrink-0">
                  {label}
                </label>
                <input
                  id={id}
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={value}
                  onChange={(e) => setOverclock(part, Number(e.target.value))}
                  className="flex-1 min-h-[36px] accent-[#e5461f]"
                />
                <span className="font-numeric tabular-nums text-sm font-semibold w-12 text-right">
                  {value}%
                </span>
              </div>
            );
          })}
          {(() => {
            const fans = activeBuild.case_fans ?? 0;
            const id = `case-fans-${activeBuild.id}`;
            return (
              <div className="flex items-center gap-3">
                <label htmlFor={id} className="text-sm text-gray-600 dark:text-gray-400 w-20 shrink-0">
                  Case fans
                </label>
                <input
                  id={id}
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={Math.min(fans, 12)}
                  onChange={(e) => setCaseFans(Number(e.target.value))}
                  className="flex-1 min-h-[36px] accent-[#e5461f]"
                />
                <span className="font-numeric tabular-nums text-sm font-semibold w-12 text-right">
                  {fans}
                </span>
              </div>
            );
          })()}
          <p className="text-xs text-gray-500">
            Overclock adds extra heat on top of the rated TDP; each fan ≈ 2 W.
          </p>
        </div>
      </details>

      {/* Custom device — anything not in the catalog */}
      <CustomDeviceForm onAdd={(model, watts) => addCustomPeripheral({ brand: 'Custom', model, watts })} />
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
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        placeholder="Custom device (e.g. Desk lamp)"
        aria-label="Custom device name"
        className="flex-1 min-w-[160px] min-h-[36px] px-3 rounded-8 border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-body text-sm"
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
        className="w-24 min-h-[36px] px-3 rounded-8 border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
      />
      <Button size="sm" variant="secondary" onClick={submit} disabled={!model.trim() || !(Number(watts) > 0)}>
        Add
      </Button>
    </div>
  );
}
