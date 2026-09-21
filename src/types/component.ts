export type ComponentCategory =
  | 'cpu' | 'gpu' | 'ram' | 'storage' | 'motherboard'
  | 'psu' | 'monitor' | 'cooler' | 'add_in_card'
  | 'optical_drive' | 'ups' | 'peripheral';

export type PsuEfficiencyRating =
  | '80-plus' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'titanium';

export interface Component {
  id: string;
  category: ComponentCategory;
  brand: string;
  model: string;
  releaseYear: number;
  tdp_w: number | null;
  specs: Record<string, string | number | boolean>;
  source: string;
  addedAt: string;
}
