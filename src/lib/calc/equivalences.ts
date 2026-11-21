/**
 * Turning kilowatt-hours into things a person can picture.
 *
 * Everything here is a unit conversion over the annual kWh figure — no new
 * measurements, no claims about this specific machine. The constants are
 * deliberately conservative and each one states its basis, because an
 * "equivalent to N trees" line is worthless (and dishonest) if the reader
 * cannot see where N comes from.
 *
 * All figures are indicative, not precise: a real thermal plant, a real car
 * and a real tree vary far more than the arithmetic suggests.
 */

export interface Equivalence {
  /** Short label, e.g. "LED bulbs lit for a year". */
  label: string;
  /** Formatted value, e.g. "4,812". */
  value: string;
  /** Short human sentence for the card. */
  sentence: string;
  /** The arithmetic, shown on hover / in the report footnote. */
  basis: string;
}

/** kWh per km for a mid-size EV (≈ 15 kWh/100 km). */
export const EV_KWH_PER_KM = 0.15;
/** A 10 W LED bulb running 24 h for a year. */
export const LED_KWH_PER_YEAR = (10 * 24 * 365) / 1000;
/** A typical domestic fridge-freezer, ~300 kWh/yr. */
export const FRIDGE_KWH_PER_YEAR = 300;
/** Coal energy content, MJ/kg (thermal coal, indicative). */
const COAL_MJ_PER_KG = 24;
/** Efficiency of a modern coal thermal plant. */
const COAL_PLANT_EFFICIENCY = 0.35;
/** Water evaporated by a thermal plant's cooling, litres per kWh (indicative). */
const WATER_L_PER_KWH = 1.8;
/** CO2 sequestered by one mature tree in a year, kg (widely used figure). */
const TREE_KG_CO2_PER_YEAR = 21;
/** A full smartphone charge, kWh. */
const PHONE_CHARGE_KWH = 0.012;

const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Coal burned to deliver one kWh from a 35%-efficient thermal plant, kg. */
export function coalKgPerKwh(): number {
  // 1 kWh = 3.6 MJ; coal energy / plant efficiency = MJ of coal per kWh.
  return 3.6 / (COAL_MJ_PER_KG * COAL_PLANT_EFFICIENCY);
}

export function equivalences(kwhPerYear: number, co2KgPerYear?: number): Equivalence[] {
  if (!Number.isFinite(kwhPerYear) || kwhPerYear <= 0) return [];

  const km = kwhPerYear / EV_KWH_PER_KM;
  const bulbs = kwhPerYear / LED_KWH_PER_YEAR;
  const fridges = kwhPerYear / FRIDGE_KWH_PER_YEAR;
  const coal = kwhPerYear * coalKgPerKwh();
  const water = kwhPerYear * WATER_L_PER_KWH;
  const phones = kwhPerYear / PHONE_CHARGE_KWH;

  const out: Equivalence[] = [
    {
      label: 'km in an electric car',
      value: nf.format(km),
      sentence: `Enough electricity to drive an electric car about ${nf.format(km)} km.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${EV_KWH_PER_KM} kWh/km (a mid-size EV uses ~15 kWh per 100 km).`,
    },
    {
      label: 'fridges running for a year',
      value: nf.format(fridges),
      sentence: `That is ${fridges.toFixed(1)} domestic fridge-freezers running for a year.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${FRIDGE_KWH_PER_YEAR} kWh/yr for a typical fridge-freezer.`,
    },
    {
      label: 'LED bulbs lit for a year',
      value: nf.format(bulbs),
      sentence: `Or ${nf.format(bulbs)} 10 W LED bulbs left on for a whole year.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${LED_KWH_PER_YEAR.toFixed(1)} kWh per 10 W bulb per year.`,
    },
    {
      label: 'kg of coal burned',
      value: nf.format(coal),
      sentence: `At India's coal-heavy grid mix, roughly ${nf.format(coal)} kg of coal is burned to make it.`,
      basis: `3.6 MJ per kWh ÷ (${COAL_MJ_PER_KG} MJ/kg × ${Math.round(COAL_PLANT_EFFICIENCY * 100)}% plant efficiency) = ${coalKgPerKwh().toFixed(2)} kg coal per kWh.`,
    },
    {
      label: 'litres of cooling water',
      value: nf.format(water),
      sentence: `Thermal generation for it evaporates around ${nf.format(water)} litres of water.`,
      basis: `${WATER_L_PER_KWH} L/kWh is an indicative figure for once-through and cooling-tower plants; it varies widely by plant.`,
    },
    {
      label: 'smartphone charges',
      value: nf.format(phones),
      sentence: `Equal to ${nf.format(phones)} full smartphone charges.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${PHONE_CHARGE_KWH} kWh per charge.`,
    },
  ];

  if (co2KgPerYear != null && co2KgPerYear > 0) {
    const trees = co2KgPerYear / TREE_KG_CO2_PER_YEAR;
    out.push({
      label: 'trees to absorb the CO2',
      value: nf.format(trees),
      sentence: `About ${nf.format(trees)} mature trees would take a year to absorb the associated CO₂.`,
      basis: `${nf.format(co2KgPerYear)} kg CO2 ÷ ${TREE_KG_CO2_PER_YEAR} kg sequestered per mature tree per year.`,
    });
  }

  return out;
}
