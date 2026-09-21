import powerProfiles from '@/data/power_profiles.json';
import type { Component, PsuEfficiencyRating } from '@/types/component';
import { wallDrawW } from './psu';

const idleRatios = powerProfiles.idleRatios as Record<string, { idle_w?: number; active_w?: number; idle_fraction_of_tdp?: number }>;
const mbPower = powerProfiles.motherboardChipsetPowerW as Record<string, number>;

export function componentPowerW(component: Component, utilPct: number): number {
  if (component.tdp_w == null) {
    // Passive / constant-power parts use spec wattage.
    if (component.category === 'peripheral') {
      return Number(component.specs.watts ?? 0);
    }
    return 0;
  }
  const u = Math.min(1, Math.max(0, utilPct));

  if (component.category === 'cpu') {
    const r = idleRatios.desktop_cpu;
    const idle = (r.idle_fraction_of_tdp ?? 0.15) * component.tdp_w;
    return idle + (component.tdp_w - idle) * u;
  }
  if (component.category === 'gpu') {
    const r = idleRatios.desktop_gpu;
    const idle = (r.idle_fraction_of_tdp ?? 0.10) * component.tdp_w;
    return idle + (component.tdp_w - idle) * u;
  }
  if (component.category === 'ram') {
    const r = idleRatios.ram_stick;
    return (r.idle_w ?? 2) + ((r.active_w ?? 5) - (r.idle_w ?? 2)) * u;
  }
  if (component.category === 'storage') {
    const t = String(component.specs.type ?? 'nvme');
    const key = t === 'HDD' ? 'hdd_7200' : t === 'SATA-SSD' ? 'sata_ssd' : 'nvme_ssd';
    const r = idleRatios[key];
    return (r.idle_w ?? 0) + ((r.active_w ?? 0) - (r.idle_w ?? 0)) * u;
  }
  if (component.category === 'motherboard') {
    const chipset = String(component.specs.chipset ?? '');
    return mbPower[chipset] ?? 7;
  }
  if (component.category === 'monitor') {
    // Constant draw; utilPct ignored.
    return Number(component.specs.panel_w ?? 0);
  }
  // Fallback: linear between 10% idle and TDP.
  return 0.10 * component.tdp_w + (component.tdp_w - 0.10 * component.tdp_w) * u;
}

export function systemPowerW(
  components: Component[],
  utilization: { cpu: number; gpu: number; ram: number; storage: number },
  psuRating: PsuEfficiencyRating | null,
  psuWattage: number = 650,
): { componentDrawW: number; wallDrawW: number } {
  let total = 0;
  for (const c of components) {
    if (c.category === 'cpu') total += componentPowerW(c, utilization.cpu);
    else if (c.category === 'gpu') total += componentPowerW(c, utilization.gpu);
    else if (c.category === 'ram') total += componentPowerW(c, utilization.ram);
    else if (c.category === 'storage') total += componentPowerW(c, utilization.storage);
    else if (c.category === 'motherboard') total += componentPowerW(c, 1);
    else if (c.category === 'peripheral' || c.category === 'add_in_card' || c.category === 'optical_drive') total += componentPowerW(c, 1);
    else total += componentPowerW(c, 0);
  }
  const psu = psuRating
    ? wallDrawW(total, psuRating, Math.min(100, (total / psuWattage) * 100))
    : total;
  return { componentDrawW: total, wallDrawW: psu };
}
