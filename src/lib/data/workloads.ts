import data from '@/data/workloads.json';
import type { Workload } from '@/types/workload';

const list = (data as { workloads: Workload[] }).workloads;

export function listWorkloads(): Workload[] {
  return list;
}

export function findWorkload(id: string): Workload | undefined {
  return list.find((w) => w.id === id);
}
