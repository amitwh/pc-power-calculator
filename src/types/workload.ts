export type WorkloadId =
  | 'gaming_1080p'
  | 'gaming_1440p'
  | 'gaming_4k'
  | 'render_blender'
  | 'video_premiere'
  | 'photo_lightroom'
  | 'compile'
  | 'office'
  | 'browser'
  | 'llm_inference'
  | 'training'
  | 'mining_etc'
  | 'mining_kawpow'
  | 'server_idle'
  | 'server_light'
  | 'server_heavy';

export interface WorkloadSchedule {
  workload_id: WorkloadId;
  hours_per_day: number;
  days_per_week?: number;
}

export interface WorkloadUtilization {
  cpu_pct: number;
  gpu_pct: number;
  ram_pct: number;
  storage_pct: number;
  monitor_w: number;
}

export interface BenchmarkEntry {
  component_id: string;
  metric: string;
  value: number;
  unit: string;
  context?: Record<string, string>;
  source: string;
}

export interface Workload {
  id: WorkloadId;
  name: string;
  category: 'gaming' | 'content' | 'productivity' | 'ai' | 'mining' | 'server';
  description: string;
  utilization: WorkloadUtilization;
  benchmarks: BenchmarkEntry[];
}
