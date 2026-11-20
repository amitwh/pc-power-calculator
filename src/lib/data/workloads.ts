import data from '@/data/workloads.json';
import type { EnergyRowId, Workload } from '@/types/workload';

const list = (data as { workloads: Workload[] }).workloads;

export function listWorkloads(): Workload[] {
  return list;
}

export function findWorkload(id: string): Workload | undefined {
  return list.find((w) => w.id === id);
}

/** Display label for an energy-breakdown row id (workload or the idle baseline). */
export function workloadLabel(id: EnergyRowId): string {
  if (id === 'idle') return 'Idle / desktop';
  return findWorkload(id)?.name ?? String(id);
}
