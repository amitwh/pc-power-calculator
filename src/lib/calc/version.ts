/**
 * Calculation-engine version, printed in every export.
 *
 * Bump the minor for a model change that can move a figure without any input
 * changing (a new efficiency curve, a utilisation factor, a tariff basis), so
 * a report printed last month can be explained against the model that made it.
 * Version history:
 *   2.1 — load-dependent 80 PLUS curves; wall draw = component draw / η
 *   2.0 — per-workload utilisation model, slab tariffs, idle baseline
 */
export const CALC_ENGINE_VERSION = '2.1';
