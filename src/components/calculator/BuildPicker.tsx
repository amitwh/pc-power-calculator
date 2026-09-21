import { useState } from 'react';
import { listComponents, findComponent } from '@/lib/data/components';
import { useBuildStore } from '@/store/buildStore';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ComponentCard } from './ComponentCard';
import type { BuildComponents, ComponentSlot } from '@/types/build';
import type { ComponentCategory } from '@/types/component';

interface SlotDef {
  key: ComponentSlot;
  label: string;
  category: ComponentCategory;
}

const slots: SlotDef[] = [
  { key: 'cpu', label: 'CPU', category: 'cpu' },
  { key: 'gpu', label: 'GPU', category: 'gpu' },
  { key: 'motherboard', label: 'Motherboard', category: 'motherboard' },
];

export function BuildPicker() {
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const setComponent = useBuildStore((s) => s.setComponent);
  const setTdpOverride = useBuildStore((s) => s.setTdpOverride);
  const addBuild = useBuildStore((s) => s.addBuild);
  const removeBuild = useBuildStore((s) => s.removeBuild);
  const setActiveBuild = useBuildStore((s) => s.setActiveBuild);
  const renameBuild = useBuildStore((s) => s.renameBuild);

  const activeBuild = builds.find((b) => b.id === activeBuildId);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [overridingSlot, setOverridingSlot] = useState<string | null>(null);

  if (!activeBuild) {
    // Defensive: should not happen because the store always keeps at least one build.
    return (
      <Card>
        <CardTitle>1. Your Build</CardTitle>
        <Button onClick={() => addBuild('My build')}>+ Add system</Button>
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
    const slotValue = activeBuild.components[slot.key as keyof BuildComponents];
    const selectedId = Array.isArray(slotValue) ? slotValue[0] : slotValue;
    const component = selectedId ? findComponent(selectedId) ?? null : null;
    const overrideW = activeBuild.tdpOverrides[slot.key] ?? null;
    const options = listComponents(slot.category).map((c) => ({
      value: c.id,
      label: `${c.brand} ${c.model} (${c.tdp_w ?? '?'} W)`,
    }));

    const isOverridingThis = overridingSlot === slot.key;
    return (
      <div key={slot.key} className="space-y-2">
        <Select
          aria-label={`Select ${slot.label}`}
          placeholder={`Choose ${slot.label}...`}
          value={selectedId ?? ''}
          options={options}
          onChange={(e) => setComponent(slot.key, e.target.value || null)}
        />
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
          <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-brand text-white text-sm font-bold">
            1
          </span>
          Your Systems
        </span>
        <Button size="sm" variant="secondary" onClick={() => addBuild()}>
          + Add system
        </Button>
      </CardTitle>

      {/* System chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1"
        role="tablist"
        aria-label="Build systems"
      >
        {builds.map((b) => {
          const isActive = b.id === activeBuildId;
          const isRenaming = renamingId === b.id;
          return (
            <div
              key={b.id}
              role="tab"
              aria-selected={isActive}
              className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 min-h-[36px] whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
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
                  className={`text-xs leading-none opacity-70 hover:opacity-100 ${isActive ? 'text-white' : 'text-gray-500'}`}
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
      </div>

      {/* Slot pickers */}
      <div className="space-y-4">{slots.map(renderSlot)}</div>
    </Card>
  );
}
