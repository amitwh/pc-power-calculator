/**
 * Turning kilowatt-hours into things a person can picture.
 *
 * Everything here is a unit conversion over the annual kWh figure — no new
 * measurements, no claims about this specific machine. The constants are
 * deliberately conservative and each one states its basis, because an
 * "equivalent to N trees" line is worthless (and dishonest) if the reader
 * cannot see where N comes from.
 *
 * All figures are indicative: a real thermal plant, a real car and a real tree
 * vary far more than the arithmetic suggests. Where a conversion assumes a
 * generation technology (coal, gas, diesel, solar) the label says so — the grid
 * is a mix, not any single one of these.
 */

export type EquivalenceGroup = 'everyday' | 'fuel' | 'water' | 'carbon';

export interface Equivalence {
  /** Stable id for icon/analytics mapping. */
  key: string;
  /** Short label, e.g. "Coal burned". */
  label: string;
  /** Formatted value, e.g. "1,845". */
  value: string;
  /** Unit shown under the value, e.g. "kg". */
  unit: string;
  /** One sentence for the card. */
  sentence: string;
  /** The arithmetic, shown on hover / in the report footnote. */
  basis: string;
  group: EquivalenceGroup;
}

/* ── Constants, each with its basis ─────────────────────────────────── */

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
/** Natural gas, MJ per cubic metre (LHV). */
const GAS_MJ_PER_M3 = 36;
/** Combined-cycle gas turbine efficiency. */
const GAS_PLANT_EFFICIENCY = 0.55;
/** Diesel, MJ per litre. */
const DIESEL_MJ_PER_L = 38.6;
/** Diesel generator efficiency. */
const DIESEL_GENSET_EFFICIENCY = 0.35;
/** Water evaporated by thermal cooling, litres per kWh (indicative). */
const WATER_L_PER_KWH = 1.8;
/** CO2 sequestered by one mature tree in a year, kg (widely used figure). */
const TREE_KG_CO2_PER_YEAR = 21;
/** Well-to-wheel CO2 for an average petrol car, kg per km. */
const PETROL_KG_CO2_PER_KM = 0.17;
/** A full smartphone charge, kWh. */
const PHONE_CHARGE_KWH = 0.012;
/** Annual yield of a 1 kWp rooftop array in India, kWh (≈ 3.8 kWh/day). */
const SOLAR_KWH_PER_KWP_YEAR = 1400;

const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });

/** Coal burned to deliver one kWh from a 35%-efficient thermal plant, kg. */
export function coalKgPerKwh(): number {
  // 1 kWh = 3.6 MJ; coal energy / plant efficiency = MJ of coal per kWh.
  return 3.6 / (COAL_MJ_PER_KG * COAL_PLANT_EFFICIENCY);
}

/** Gas burned to deliver one kWh from a 55%-efficient combined-cycle plant, m³. */
export function gasM3PerKwh(): number {
  return 3.6 / (GAS_MJ_PER_M3 * GAS_PLANT_EFFICIENCY);
}

/** Diesel burned to deliver one kWh from a 35%-efficient genset, litres. */
export function dieselLPerKwh(): number {
  return 3.6 / (DIESEL_MJ_PER_L * DIESEL_GENSET_EFFICIENCY);
}

/** MWh → years of output from a kWp of rooftop solar. */
export function solarKwpYears(kwhPerYear: number): number {
  return kwhPerYear / SOLAR_KWH_PER_KWP_YEAR;
}

export function equivalences(kwhPerYear: number, co2KgPerYear?: number): Equivalence[] {
  if (!Number.isFinite(kwhPerYear) || kwhPerYear <= 0) return [];

  const km = kwhPerYear / EV_KWH_PER_KM;
  const bulbs = kwhPerYear / LED_KWH_PER_YEAR;
  const fridges = kwhPerYear / FRIDGE_KWH_PER_YEAR;
  const coal = kwhPerYear * coalKgPerKwh();
  const gas = kwhPerYear * gasM3PerKwh();
  const diesel = kwhPerYear * dieselLPerKwh();
  const water = kwhPerYear * WATER_L_PER_KWH;
  const phones = kwhPerYear / PHONE_CHARGE_KWH;
  const kwpYears = solarKwpYears(kwhPerYear);

  const out: Equivalence[] = [
    {
      key: 'ev',
      label: 'Driving, electric',
      value: nf.format(km),
      unit: 'km',
      sentence: `Enough electricity to drive an electric car about ${nf.format(km)} km.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${EV_KWH_PER_KM} kWh/km (a mid-size EV uses ~15 kWh per 100 km).`,
      group: 'everyday',
    },
    {
      key: 'fridge',
      label: 'Fridges, for a year',
      value: nf1.format(fridges),
      unit: 'units',
      sentence: `That is ${nf1.format(fridges)} domestic fridge-freezers running for a year.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${FRIDGE_KWH_PER_YEAR} kWh/yr for a typical fridge-freezer.`,
      group: 'everyday',
    },
    {
      key: 'led',
      label: 'LED bulbs, for a year',
      value: nf.format(bulbs),
      unit: 'bulbs',
      sentence: `Or ${nf.format(bulbs)} 10 W LED bulbs left on for a whole year.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${LED_KWH_PER_YEAR.toFixed(1)} kWh per 10 W bulb per year.`,
      group: 'everyday',
    },
    {
      key: 'coal',
      label: 'If it were coal',
      value: nf.format(coal),
      unit: 'kg burned',
      sentence: `Coal-fired generation would burn about ${nf.format(coal)} kg of coal to deliver it.`,
      basis: `3.6 MJ per kWh ÷ (${COAL_MJ_PER_KG} MJ/kg × ${Math.round(COAL_PLANT_EFFICIENCY * 100)}% plant efficiency) = ${coalKgPerKwh().toFixed(2)} kg coal per kWh.`,
      group: 'fuel',
    },
    {
      key: 'gas',
      label: 'If it were gas',
      value: nf1.format(gas),
      unit: 'm³ burned',
      sentence: `A combined-cycle gas plant would burn roughly ${nf1.format(gas)} m³ of natural gas.`,
      basis: `3.6 MJ per kWh ÷ (${GAS_MJ_PER_M3} MJ/m³ × ${Math.round(GAS_PLANT_EFFICIENCY * 100)}% CCGT efficiency) = ${gasM3PerKwh().toFixed(2)} m³ per kWh.`,
      group: 'fuel',
    },
    {
      key: 'diesel',
      label: 'If it were diesel',
      value: nf.format(diesel),
      unit: 'litres burned',
      sentence: `On a diesel generator it would take about ${nf.format(diesel)} litres of fuel.`,
      basis: `3.6 MJ per kWh ÷ (${DIESEL_MJ_PER_L} MJ/L × ${Math.round(DIESEL_GENSET_EFFICIENCY * 100)}% genset efficiency) = ${dieselLPerKwh().toFixed(2)} L per kWh.`,
      group: 'fuel',
    },
    {
      key: 'water',
      label: 'Cooling water',
      value: nf.format(water),
      unit: 'litres',
      sentence: `Thermal generation for it evaporates around ${nf.format(water)} litres of water.`,
      basis: `${WATER_L_PER_KWH} L/kWh is an indicative figure for once-through and cooling-tower plants; it varies widely by plant.`,
      group: 'water',
    },
    {
      key: 'solar',
      label: 'From the sun',
      value: nf1.format(kwpYears),
      unit: 'kWp-years',
      sentence: `A 1 kW rooftop solar array would need about ${nf1.format(kwpYears)} years to generate it.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${nf.format(SOLAR_KWH_PER_KWP_YEAR)} kWh per kWp per year (≈ 3.8 kWh/day in India).`,
      group: 'everyday',
    },
    {
      key: 'phone',
      label: 'Phone charges',
      value: nf.format(phones),
      unit: 'charges',
      sentence: `Equal to ${nf.format(phones)} full smartphone charges.`,
      basis: `${nf.format(kwhPerYear)} kWh ÷ ${PHONE_CHARGE_KWH} kWh per charge.`,
      group: 'everyday',
    },
  ];

  if (co2KgPerYear != null && co2KgPerYear > 0) {
    const trees = co2KgPerYear / TREE_KG_CO2_PER_YEAR;
    const petrolKm = co2KgPerYear / PETROL_KG_CO2_PER_KM;
    out.push(
      {
        key: 'co2',
      label: 'Carbon dioxide',
        value: nf.format(co2KgPerYear),
        unit: 'kg CO₂e',
        sentence: `${nf.format(co2KgPerYear)} kg of CO₂e, at the grid factor used.`,
        basis: `${nf.format(kwhPerYear)} kWh × grid factor. Change the factor to your supplier's fuel mix.`,
        group: 'carbon',
      },
      {
        key: 'car',
      label: 'Cars, equivalent',
        value: nf.format(petrolKm),
        unit: 'km driven',
        sentence: `The same emissions as driving a petrol car about ${nf.format(petrolKm)} km.`,
        basis: `${nf.format(co2KgPerYear)} kg CO₂ ÷ ${PETROL_KG_CO2_PER_KM} kg CO₂ per km (average petrol car, well-to-wheel).`,
        group: 'carbon',
      },
      {
        key: 'tree',
      label: 'Trees to absorb it',
        value: nf.format(trees),
        unit: 'tree-years',
        sentence: `About ${nf.format(trees)} mature trees would take a year to absorb that CO₂.`,
        basis: `${nf.format(co2KgPerYear)} kg CO₂ ÷ ${TREE_KG_CO2_PER_YEAR} kg sequestered per mature tree per year.`,
        group: 'carbon',
      },
    );
  }

  return out;
}
