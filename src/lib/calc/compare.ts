import type { BuildConfig } from '@/types/build';
import type { BenchmarkEntry, Workload, WorkloadId } from '@/types/workload';
import { lookupBenchmark } from '@/lib/data/benchmarks';
import { computeEnergy } from './energy';

export interface ComparisonRow {
  workload_id: WorkloadId;
  perBuildKwh: Record<string, number>;
  perBuildCost: Record<string, number>;
  perBuildPerf: Record<string, BenchmarkEntry[]>;
}

export interface ComparisonTotal {
  buildId: string;
  buildName: string;
  kwh: number;
  cost: number;
}

export interface ComparisonResult {
  rows: ComparisonRow[];
  totals: ComparisonTotal[];
}

export function compareBuilds(
  builds: BuildConfig[],
  workloads: Workload[],
  period: 'day' | 'month' | 'year',
): ComparisonResult {
  const results = builds.map((b) =>
    computeEnergy(b, workloads, period, b.location.manual_rate_override ?? undefined),
  );
  const rows: ComparisonRow[] = [];
  for (let i = 0; i < workloads.length; i++) {
    const wlId = workloads[i].id;
    const row: ComparisonRow = { workload_id: wlId, perBuildKwh: {}, perBuildCost: {}, perBuildPerf: {} };
    for (let j = 0; j < builds.length; j++) {
      const r = results[j].perWorkload[i];
      if (r) {
        row.perBuildKwh[builds[j].id] = r.kwh;
        row.perBuildCost[builds[j].id] = r.cost;
      } else {
        row.perBuildKwh[builds[j].id] = 0;
        row.perBuildCost[builds[j].id] = 0;
      }

      // Per-workload benchmark lookup — works regardless of whether this
      // workload is in the build's schedule, so the comparison column stays
      // populated for every workload/component combo.
      const perfMetricsForRow: BenchmarkEntry[] = [];
      const gpuId = builds[j].components.gpu;
      const cpuId = builds[j].components.cpu;
      if (gpuId) perfMetricsForRow.push(...lookupBenchmark(gpuId, wlId));
      if (cpuId) perfMetricsForRow.push(...lookupBenchmark(cpuId, wlId));
      row.perBuildPerf[builds[j].id] = perfMetricsForRow;
    }
    rows.push(row);
  }
  const totals = builds.map((b, j) => ({
    buildId: b.id,
    buildName: b.name,
    kwh: results[j].total.kwh,
    cost: results[j].total.cost,
  }));
  return { rows, totals };
}
