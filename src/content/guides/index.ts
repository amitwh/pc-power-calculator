import { cuttingPcPower } from './cutting-pc-power';
import { gamingPcPower } from './gaming-pc-power';
import { howElectricityTariffsWork } from './how-electricity-tariffs-work';
import { indiaTariff } from './india-tariff';
import { localAiPower } from './local-ai-power';
import { psuSizing } from './psu-sizing';
import { runningPc247 } from './running-pc-24-7';
import { wallPowerVsComponentPower } from './wall-power-vs-component-power';
import { whatEachComponentDraws } from './what-each-component-draws';
import type { Guide, GuideCategory } from './types';

export type { Guide, GuideCategory } from './types';

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
  whatEachComponentDraws,
  wallPowerVsComponentPower,
  cuttingPcPower,
  runningPc247,
  localAiPower,
  indiaTariff,
  howElectricityTariffsWork,
];

/**
 * The sections the hub groups guides into.
 *
 * Why: the categories are content, not layout — the hub, the nav dropdown and
 * the category filter all read the same list, so the labels and blurbs are
 * written once.
 */
export const GUIDE_CATEGORIES: { id: GuideCategory; label: string; blurb: string }[] = [
  {
    id: 'power',
    label: 'Power & electricity',
    blurb: 'How much a build draws, what the power supply does with it, and what it costs to run.',
  },
  {
    id: 'hardware',
    label: 'Hardware deep-dives',
    blurb: 'What each part of a PC is, what it does, and why it draws the watts it draws.',
  },
  {
    id: 'billing',
    label: 'Electricity billing',
    blurb: 'Slabs, duty and fixed charges — how an Indian bill is actually built.',
  },
];
