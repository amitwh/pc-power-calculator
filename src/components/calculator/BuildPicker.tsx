import { useState } from 'react';
import { listComponents, findComponent } from '@/lib/data/components';
import { useBuildStore } from '@/store/buildStore';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ComponentCard } from './ComponentCard';
import type { BuildComponents, BuildCategory, ComponentSlot } from '@/types/build';
import type { ComponentCategory, Component } from '@/types/component';
import { CATEGORY_EMOJI, CATEGORY_LABEL } from '@/lib/buildCategory';

interface SlotDef {
  key: ComponentSlot;
  label: string;
  category: ComponentCategory;
  /** True for slots that hold multiple components (storage, ram, monitors, etc.). */
  multi?: boolean;
}

const slots: SlotDef[] = [
  { key: 'cpu', label: 'CPU', category: 'cpu' },
  { key: 'gpu', label: 'GPU', category: 'gpu' },
  { key: 'motherboard', label: 'Motherboard', category: 'motherboard' },
  { key: 'psu', label: 'PSU', category: 'psu' },
  { key: 'cooler', label: 'Cooler', category: 'cooler' },
  { key: 'ram', label: 'RAM', category: 'ram', multi: true },
  { key: 'storage', label: 'Storage', category: 'storage', multi: true },
  { key: 'monitor', label: 'Monitor', category: 'monitor', multi: true },
  { key: 'add_in_cards', label: 'Add-in cards', category: 'add_in_card', multi: true },
  { key: 'optical_drives', label: 'Optical drives', category: 'optical_drive', multi: true },
  { key: 'ups', label: 'UPS', category: 'ups' },
  { key: 'peripherals', label: 'Peripherals', category: 'peripheral', multi: true },
];

const CATEGORIES: BuildCategory[] = ['gaming', 'workstation', 'nas', 'ai', 'general'];

export function BuildPicker() {
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const customPeripherals = useBuildStore((s) => s.customPeripherals);
  const setComponent = useBuildStore((s) => s.setComponent);
  const addComponent = useBuildStore((s) => s.addComponent);
  const removeComponent = useBuildStore((s) => s.removeComponent);
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
  const [overridingSlot, setOverridingSlot] = useState<string | null>(null);

  if (!activeBuild) {
    return (
      <Card>
        <CardTitle>1. Your Systems</CardTitle>
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

  const renderSlot = (slot: SlotDef) => {
    const isMulti = !!slot.multi;
    const slotValue = activeBuild.components[slot.key as keyof BuildComponents];
    const selectedIds: string[] = isMulti
      ? ((slotValue as string[] | undefined) ?? [])
      : (slotValue ? [slotValue as string] : []);
    const overrideW = activeBuild.tdpOverrides[slot.key] ?? null;
    const categoryComponents = listComponents(slot.category);
    const options = categoryComponents.map((c) => ({
      value: c.id,
      label: `${c.brand} ${c.model} (${c.tdp_w ?? '?'} W)`,
      meta: { brand: c.brand, year: c.releaseYear, tdp_w: c.tdp_w },
    }));

    if (isMulti) {
      const selectedComps: Component[] = selectedIds
        .map((id) => findComponent(id) ?? customPeripherals.find((p) => p.id === id))
        .filter((c): c is Component => !!c);
      return (
        <div key={slot.key} className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedComps.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 min-h-[36px] text-sm"
              >
                <span className="font-semibold truncate max-w-[260px]">
                  {c.brand} {c.model}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${c.brand} ${c.model}`}
                  className="text-base leading-none opacity-70 hover:opacity-100"
                  onClick={() => removeComponent(slot.key, c.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <SearchableSelect
            ariaLabel={`Add ${slot.label}`}
            placeholder={`+ Add ${slot.label}…`}
            value=""
            options={options.filter((o) => !selectedIds.includes(o.value))}
            onChange={(v) => v && addComponent(slot.key, v)}
            brandFilter
          />
        </div>
      );
    }

    // Single-slot rendering (CPU / GPU / motherboard / PSU / cooler)
    const selectedId = selectedIds[0] ?? null;
    const component = selectedId ? findComponent(selectedId) ?? null : null;
    const isOverridingThis = overridingSlot === slot.key;
    const useSearchable = categoryComponents.length > 12;
    return (
      <div key={slot.key} className="space-y-2">
        {useSearchable ? (
          <SearchableSelect
            ariaLabel={`Select ${slot.label}`}
            placeholder={`Choose ${slot.label}…`}
            value={selectedId ?? ''}
            options={options}
            onChange={(v) => setComponent(slot.key, v)}
          />
        ) : (
          <Select
            aria-label={`Select ${slot.label}`}
            placeholder={`Choose ${slot.label}...`}
            value={selectedId ?? ''}
            options={options}
            onChange={(e) => setComponent(slot.key, e.target.value || null)}
          />
        )}
        <ComponentCard
          categoryLabel={slot.label}
          component={component}
          tdpOverrideW={overrideW}
          onClear={() => {
            setComponent(slot.key, null);
            setTdpOverride(slot.key, null);
          }}
          onOverride={() => setOverridingSlot(isOverridingThis ? null : slot.key)}
        />
        {isOverridingThis && (
          <div className="flex items-center gap-2 pl-1">
            <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor={`tdp-${slot.key}`}>
              TDP override (W):
            </label>
            <input
              id={`tdp-${slot.key}`}
              type="number"
              min={0}
              step={1}
              defaultValue={overrideW ?? component?.tdp_w ?? ''}
              className="min-h-[36px] w-24 px-2 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-body"
              onBlur={(e) => {
                const v = e.target.value.trim();
                setTdpOverride(slot.key, v === '' ? null : Number(v));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setTdpOverride(slot.key, null);
                  setOverridingSlot(null);
                }
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setTdpOverride(slot.key, null);
                setOverridingSlot(null);
              }}
            >
              Reset
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardTitle>
        <span>
          <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-brand-dark text-white text-sm font-bold">
            1
          </span>
          Your Systems
        </span>
      </CardTitle>

      {/* System selector chips.
          Using role="group" (not tablist) because each chip contains its own
          interactive controls (switch + remove + rename). tablist would require
          each direct child to be a single tab role with no nested interactive
          content — these chips are pickers, not tabs. */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1"
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
              className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 min-h-[44px] whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-dark text-white border-brand-dark'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <span aria-hidden className="text-base leading-none">
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
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-400 dark:border-gray-600 px-3 py-1.5 min-h-[44px] whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-brand-dark hover:text-brand-dark transition-colors"
        >
          + Add system
        </button>
      </div>

      {/* Category picker for the active build */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs uppercase tracking-wide text-gray-500 mr-1">Category:</span>
        {CATEGORIES.map((c) => {
          const isSelected = (activeBuild.category ?? 'general') === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setBuildCategory(activeBuild.id, c)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                isSelected
                  ? 'bg-brand/10 border-brand-text text-brand-text'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400'
              }`}
              aria-pressed={isSelected}
            >
              <span aria-hidden>{CATEGORY_EMOJI[c]}</span>
              {CATEGORY_LABEL[c]}
            </button>
          );
        })}
      </div>

      {/* Slot pickers */}
      <div className="space-y-4">{slots.map(renderSlot)}</div>

      {/* Performance + chassis extras */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
          Overclocking &amp; fans
        </div>
        <div className="space-y-1">
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
                  className="flex-1 min-h-[44px] accent-[#e5461f]"
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
                  className="flex-1 min-h-[44px] accent-[#e5461f]"
                />
                <span className="font-numeric tabular-nums text-sm font-semibold w-12 text-right">
                  {fans}
                </span>
              </div>
            );
          })()}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Overclock adds extra heat on top of the rated TDP; each fan ≈ 2 W.
        </p>
      </div>

      {/* Custom device — anything not in the catalog */}
      <CustomDeviceForm onAdd={(model, watts) => addCustomPeripheral({ brand: 'Custom', model, watts })} />
      {activeBuild.components.peripherals?.some((id) => id.startsWith('user-peripheral-')) && (
        <div className="flex flex-wrap gap-2">
          {activeBuild.components.peripherals
            .filter((id) => id.startsWith('user-peripheral-'))
            .map((id) => {
              const p = customPeripherals.find((x) => x.id === id);
              if (!p) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 min-h-[36px] text-sm"
                >
                  <span className="font-semibold truncate max-w-[220px]">{p.model}</span>
                  <span className="font-numeric tabular-nums text-gray-500">{p.tdp_w} W</span>
                  <button
                    type="button"
                    aria-label={`Remove ${p.model}`}
                    className="text-base leading-none opacity-70 hover:opacity-100"
                    onClick={() => removeCustomPeripheral(id)}
                  >
                    ×
                  </button>
                </span>
              );
            })}
        </div>
      )}
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
    <div className="mt-4 p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-8">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
        Add a custom device
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Device name (e.g. Desk lamp)"
          aria-label="Custom device name"
          className="flex-1 min-w-[160px] min-h-[44px] px-3 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-body"
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
          className="w-24 min-h-[44px] px-3 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums"
        />
        <Button onClick={submit} disabled={!model.trim() || !(Number(watts) > 0)}>
          Add device
        </Button>
      </div>
    </div>
  );
}
