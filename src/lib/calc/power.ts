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
    // DDR1/DDR2 sticks ran at higher voltages than DDR3+; use era profiles.
    const gen = String(component.specs.generation ?? '');
    const r = gen === 'DDR' ? idleRatios.ddr1_stick : gen === 'DDR2' ? idleRatios.ddr2_stick : idleRatios.ram_stick;
    const idleW = r.idle_w ?? 2;
    return idleW + ((r.active_w ?? 5) - idleW) * u;
  }
  if (component.category === 'storage') {
    const t = String(component.specs.type ?? 'nvme');
    const key = t === 'HDD' ? 'hdd_7200' : t === 'IDE-HDD' ? 'ide_hdd' : t === 'SATA-SSD' ? 'sata_ssd' : 'nvme_ssd';
    const r = idleRatios[key];
    return (r.idle_w ?? 0) + ((r.active_w ?? 0) - (r.idle_w ?? 0)) * u;
  }
  if (component.category === 'motherboard') {
    const chipset = String(component.specs.chipset ?? '');
    return mbPower[chipset] ?? 7;
  }
  if (component.category === 'monitor') {
    // Constant draw; utilPct ignored.
    return Number(component.specs.panel_w ?? component.tdp_w ?? 0);
  }
  if (component.category === 'cooler') {
    // tdp_w is the fan/pump draw (cooling capacity lives in specs.tdp_rating_w).
    return component.tdp_w;
  }
  if (component.category === 'fan') {
    // Case fans draw their rated power constantly (RGB/PWM variants included).
    return component.tdp_w;
  }
  // Fallback: linear between 10% idle and TDP.
  return 0.10 * component.tdp_w + (component.tdp_w - 0.10 * component.tdp_w) * u;
}

/**
 * Components powered straight from the wall, bypassing the PSU. Their draw is
 * never divided by PSU efficiency.
 */
const WALL_SIDE_CATEGORIES = new Set(['monitor']);

/** Utilization for a machine that is powered on but running no workload. */
export const IDLE_UTILIZATION = { cpu: 0, gpu: 0, ram: 0, storage: 0 };

/**
 * Power split between the PSU and the wall.
 *
 * `componentDrawW` is the PSU-side load only (monitors excluded). `wallDirectW`
 * is the constant draw of wall-side parts (monitors). `wallDrawW` is the total
 * at the wall: the PSU-side load divided by efficiency at its own load
 * percentage, plus `wallDirectW`.
 *
 * `includeMonitors: false` skips wall-side parts entirely (they sleep while the
 * PC idles).
 */
export function systemPowerW(
  components: Component[],
  utilization: { cpu: number; gpu: number; ram: number; storage: number },
  psuRating: PsuEfficiencyRating | null,
  psuWattage: number = 650,
  options: { includeMonitors?: boolean } = {},
): {
  componentDrawW: number;
  wallDirectW: number;
  wallDrawW: number;
  /** UPS conversion efficiency applied to the PSU-side load (1 = no UPS). */
  upsEfficiency: number;
} {
  const includeMonitors = options.includeMonitors ?? true;
  let total = 0;
  let wallDirect = 0;
  for (const c of components) {
    if (WALL_SIDE_CATEGORIES.has(c.category)) {
      if (includeMonitors) wallDirect += componentPowerW(c, 1);
      continue;
    }
    if (c.category === 'cpu') total += componentPowerW(c, utilization.cpu);
    else if (c.category === 'gpu') total += componentPowerW(c, utilization.gpu);
    else if (c.category === 'ram') total += componentPowerW(c, utilization.ram);
    else if (c.category === 'storage') total += componentPowerW(c, utilization.storage);
    else if (c.category === 'motherboard') total += componentPowerW(c, 1);
    else if (c.category === 'peripheral' || c.category === 'add_in_card' || c.category === 'optical_drive') total += componentPowerW(c, 1);
    else total += componentPowerW(c, 0);
  }
  const psuSideWallW = psuRating
    ? wallDrawW(total, psuRating, Math.min(100, (total / psuWattage) * 100))
    : total;

  /**
   * A UPS is a second conversion stage: it inverts DC back to AC, and that
   * costs energy even when the mains is fine. It is not a load of its own, so
   * it never appears as a wattage — it divides the load, the way the PSU does.
   *
   * Efficiency comes from the catalog entry when it states one
   * (`efficiency_pct`), otherwise a documented 95% assumption for a
   * line-interactive unit. Online double-conversion units are nearer 90%.
   */
  const ups = components.find((c) => c.category === 'ups');
  const stated = Number(ups?.specs.efficiency_pct);
  const upsEfficiency = ups
    ? Number.isFinite(stated) && stated > 50 && stated < 100
      ? stated / 100
      : 0.95
    : 1;

  return {
    componentDrawW: total,
    wallDirectW: wallDirect,
    wallDrawW: psuSideWallW / upsEfficiency + wallDirect,
    upsEfficiency,
  };
}
