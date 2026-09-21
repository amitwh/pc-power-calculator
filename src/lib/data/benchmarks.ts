import data from '@/data/benchmarks.json';
import type { BenchmarkEntry } from '@/types/workload';
import type { WorkloadId } from '@/types/workload';

const all = (data as { benchmarks: Array<BenchmarkEntry & { workload: WorkloadId }> }).benchmarks;

export function lookupBenchmark(componentId: string, workloadId: WorkloadId): BenchmarkEntry[] {
  return all.filter((b) => b.component_id === componentId && b.workload === workloadId);
}

export function benchmarkDataVersion(): string {
  return (data as { version: string }).version;
}

export function benchmarkLastUpdated(): string {
  return (data as { lastUpdated: string }).lastUpdated;
}