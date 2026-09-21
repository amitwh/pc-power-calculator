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
