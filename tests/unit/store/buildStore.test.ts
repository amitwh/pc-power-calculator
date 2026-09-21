/// <reference types="vitest/globals" />
import { describe, expect, test, beforeEach } from 'vitest';
import { useBuildStore } from '@/store/buildStore';

const active = () => {
  const s = useBuildStore.getState();
  return s.builds.find((b) => b.id === s.activeBuildId);
};

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('buildStore — single-build actions on active build', () => {
  test('setComponent assigns a slot', () => {
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    expect(active()!.components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
  });

  test('setComponent(null) clears the slot', () => {
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    useBuildStore.getState().setComponent('cpu', null);
    expect(active()!.components.cpu).toBeUndefined();
  });

  test('setSchedule replaces the array', () => {
    useBuildStore.getState().setSchedule([{ workload_id: 'gaming_1080p', hours_per_day: 4 }]);
    expect(active()!.schedule).toHaveLength(1);
  });

  test('setLocation updates country + subdivision', () => {
    useBuildStore.getState().setLocation('IN', 'IN-KL');
    expect(active()!.location.country_iso2).toBe('IN');
    expect(active()!.location.subdivision_code).toBe('IN-KL');
  });

  test('setManualRate stores and clears', () => {
    useBuildStore.getState().setManualRate(7.5);
    expect(active()!.location.manual_rate_override).toBe(7.5);
    useBuildStore.getState().setManualRate(null);
    expect(active()!.location.manual_rate_override).toBeUndefined();
  });

  test('setCurrency updates currency_override', () => {
    useBuildStore.getState().setCurrency('USD');
    expect(active()!.currency_override).toBe('USD');
  });
});

describe('buildStore — export/import', () => {
  test('exportBuild returns JSON, importBuild restores it', () => {
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    const json = useBuildStore.getState().exportBuild();
    useBuildStore.getState().resetAll();
    useBuildStore.getState().importBuild(json);
    expect(active()!.components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
  });

  test('persists to localStorage', () => {
    useBuildStore.getState().setComponent('gpu', 'gpu-nvidia-rtx-4070');
    const stored = JSON.parse(localStorage.getItem('pc-power-builds')!);
    const persistedActive = stored.state.activeBuildId;
    const persistedBuild = stored.state.builds.find((b: { id: string }) => b.id === persistedActive);
    expect(persistedBuild.components.gpu).toBe('gpu-nvidia-rtx-4070');
  });
});

describe('buildStore — multi-build (customisation)', () => {
  test('starts with a single default build named "My build"', () => {
    const s = useBuildStore.getState();
    expect(s.builds).toHaveLength(1);
    expect(s.builds[0].name).toBe('My build');
    expect(s.activeBuildId).toBe(s.builds[0].id);
  });

  test('addBuild appends and becomes active', () => {
    const id = useBuildStore.getState().addBuild('Workstation');
    expect(useBuildStore.getState().builds).toHaveLength(2);
    expect(useBuildStore.getState().activeBuildId).toBe(id);
    expect(active()!.name).toBe('Workstation');
    expect(active()!.id).toBe(id);
  });

  test('setActiveBuild switches the active build', () => {
    const original = useBuildStore.getState().activeBuildId;
    const id = useBuildStore.getState().addBuild('Server');
    expect(useBuildStore.getState().activeBuildId).toBe(id);
    useBuildStore.getState().setActiveBuild(original);
    expect(useBuildStore.getState().activeBuildId).toBe(original);
    expect(active()!.id).toBe(original);
  });

  test('renameBuild updates the name', () => {
    const id = useBuildStore.getState().addBuild('New rig');
    useBuildStore.getState().renameBuild(id, 'Office PC');
    const b = useBuildStore.getState().builds.find((x) => x.id === id)!;
    expect(b.name).toBe('Office PC');
  });

  test('removeBuild drops the build and activates the first remaining', () => {
    const id1 = useBuildStore.getState().addBuild('Build A');
    const id2 = useBuildStore.getState().addBuild('Build B');
    useBuildStore.getState().setActiveBuild(id1);
    useBuildStore.getState().removeBuild(id1);
    const s = useBuildStore.getState();
    expect(s.builds).toHaveLength(2);
    expect(s.builds.find((b) => b.id === id1)).toBeUndefined();
    expect(s.activeBuildId).toBe(id2);
  });

  test('removeBuild on the last build is a no-op (keeps at least one)', () => {
    const only = useBuildStore.getState().activeBuildId;
    useBuildStore.getState().removeBuild(only);
    const s = useBuildStore.getState();
    expect(s.builds).toHaveLength(1);
    expect(s.activeBuildId).toBe(only);
  });

  test('mutations only affect the active build', () => {
    const original = useBuildStore.getState().activeBuildId;
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    const id2 = useBuildStore.getState().addBuild('Other');
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-9-9950x');
    useBuildStore.getState().setActiveBuild(original);
    const other = useBuildStore.getState().builds.find((b) => b.id !== id2)!;
    expect(other.components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
    const newer = useBuildStore.getState().builds.find((b) => b.id === id2)!;
    expect(newer.components.cpu).toBe('cpu-amd-ryzen-9-9950x');
  });
});

describe('buildStore — TDP overrides (customisation)', () => {
  test('setTdpOverride records an override for the slot', () => {
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    useBuildStore.getState().setTdpOverride('cpu', 95);
    expect(active()!.tdpOverrides.cpu).toBe(95);
  });

  test('setTdpOverride(null) clears the override', () => {
    useBuildStore.getState().setTdpOverride('cpu', 95);
    useBuildStore.getState().setTdpOverride('cpu', null);
    expect(active()!.tdpOverrides.cpu).toBeUndefined();
  });

  test('TDP overrides are per-build', () => {
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    useBuildStore.getState().setTdpOverride('cpu', 95);
    const original = useBuildStore.getState().activeBuildId;
    useBuildStore.getState().addBuild('Other');
    expect(active()!.tdpOverrides.cpu).toBeUndefined();
    useBuildStore.getState().setActiveBuild(original);
    expect(active()!.tdpOverrides.cpu).toBe(95);
  });
});

describe('buildStore — custom peripherals (round-trip)', () => {
  test('addCustomPeripheral adds an entry under components.peripherals', () => {
    const id = useBuildStore.getState().addCustomPeripheral({
      brand: 'Generic',
      model: 'USB fan strip',
      watts: 4.5,
    });
    const pers = active()!.components.peripherals!;
    expect(pers).toContain(id);
    const all = useBuildStore.getState().customPeripherals;
    const entry = all.find((c) => c.id === id)!;
    expect(entry.brand).toBe('Generic');
    expect(entry.model).toBe('USB fan strip');
    expect(entry.specs.watts).toBe(4.5);
    expect(entry.category).toBe('peripheral');
    expect(entry.source).toBe('user');
  });

  test('removeCustomPeripheral removes from both list and components.peripherals', () => {
    const id = useBuildStore.getState().addCustomPeripheral({
      brand: 'Generic',
      model: 'USB fan strip',
      watts: 4.5,
    });
    useBuildStore.getState().removeCustomPeripheral(id);
    expect(active()!.components.peripherals ?? []).not.toContain(id);
    expect(useBuildStore.getState().customPeripherals.find((c) => c.id === id)).toBeUndefined();
  });
});
