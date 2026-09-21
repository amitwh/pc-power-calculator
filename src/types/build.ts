import type { WorkloadSchedule } from './workload';

export type BuildCategory = 'gaming' | 'workstation' | 'nas' | 'ai' | 'general';

export interface BuildComponents {
  cpu?: string;
  gpu?: string;
  ram?: string[];
  storage?: string[];
  motherboard?: string;
  psu?: string;
  cooler?: string;
  monitors?: string[];
  add_in_cards?: string[];
  optical_drives?: string[];
  ups?: string;
  peripherals?: string[];
}

/**
 * Per-build TDP overrides. Keyed by the component id (for peripherals) or by
 * the slot name (for single-instance slots like `cpu`, `gpu`, `motherboard`,
 * `psu`, `cooler`, `ups`). When present, the calc engine uses the override
 * value instead of the component's `tdp_w`.
 */
export type TdpOverrides = Record<string, number>;

export interface BuildConfig {
  id: string;
  name: string;
  /** Optional purpose tag — drives the chip emoji + summary tile icon. */
  category?: BuildCategory;
  components: BuildComponents;
  tdpOverrides: TdpOverrides;
  schedule: WorkloadSchedule[];
  location: { country_iso2: string; subdivision_code?: string; manual_rate_override?: number };
  currency_override?: string;
}

export type ComponentSlot = keyof BuildComponents | 'ram' | 'storage' | 'monitor' | 'add_in_card' | 'optical_drive' | 'peripheral';
// (ram/storage/monitors etc. accept arrays; the store handles array vs single-slot semantics separately.)
