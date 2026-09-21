import { describe, expect, test } from 'vitest';
import { lookupBenchmark, benchmarkDataVersion } from '@/lib/data/benchmarks';

describe('benchmarks', () => {
  test('returns entries for a known GPU + gaming workload', () => {
    const r = lookupBenchmark('gpu-nvidia-rtx-4070', 'gaming_1080p');
    expect(r.length).toBeGreaterThan(0);
  });
  test('returns empty array for unknown component', () => {
    const r = lookupBenchmark('gpu-does-not-exist', 'gaming_1080p');
    expect(r).toEqual([]);
  });
  test('data has a version field', () => {
    expect(benchmarkDataVersion()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});