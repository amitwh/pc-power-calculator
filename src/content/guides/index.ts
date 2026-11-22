import { coolingExplained } from './cooling-explained';
import { cuttingPcPower } from './cutting-pc-power';
import { cpuCaches } from './cpu-caches';
import { cpuExplained } from './cpu-explained';
import { fpuExplained } from './fpu-explained';
import { gamingPcPower } from './gaming-pc-power';
import { gpuExplained } from './gpu-explained';
import { hardwareGlossary } from './hardware-glossary';
import { howAPcWorks } from './how-a-pc-works';
import { howElectricityTariffsWork } from './how-electricity-tariffs-work';
import { igpuVsDgpu } from './igpu-vs-dgpu';
import { indiaTariff } from './india-tariff';
import { localAiPower } from './local-ai-power';
import { motherboardExplained } from './motherboard-explained';
import { npuExplained } from './npu-explained';
import { pcieAndM2 } from './pcie-and-m2';
import { powerFactorCorrection } from './power-factor-correction';
import { psuConnectors } from './psu-connectors';
import { psuEfficiency } from './psu-efficiency';
import { psuSizing } from './psu-sizing';
import { ramExplained } from './ram-explained';
import { runningPc247 } from './running-pc-24-7';
import { storageExplained } from './storage-explained';
import { vramExplained } from './vram-explained';
import { wallPowerVsComponentPower } from './wall-power-vs-component-power';
import { whatEachComponentDraws } from './what-each-component-draws';
import type { Guide } from './types';

export type { Guide, GuideCategory } from './types';
export {
  GUIDE_CATEGORIES,
  GUIDE_CATEGORY_STYLES,
  type GuideCategoryStyle,
} from './categories';

/**
 * The guide registry.
 *
 * Why: the hub, the nav dropdown and the prerender manifest all need the same
 * list, so there is exactly one of them here. The order below is the display
 * order — within a category the pillar article comes first, and new guides
 * slot into the right place rather than being appended to the end.
 */
export const GUIDES: Guide[] = [
  gamingPcPower,
  psuSizing,
  psuEfficiency,
  powerFactorCorrection,
  psuConnectors,
  whatEachComponentDraws,
  wallPowerVsComponentPower,
  cuttingPcPower,
  runningPc247,
  localAiPower,
  indiaTariff,
  howElectricityTariffsWork,
  howAPcWorks,
  motherboardExplained,
  cpuExplained,
  cpuCaches,
  fpuExplained,
  npuExplained,
  coolingExplained,
  gpuExplained,
  igpuVsDgpu,
  vramExplained,
  ramExplained,
  storageExplained,
  pcieAndM2,
  hardwareGlossary,
];
