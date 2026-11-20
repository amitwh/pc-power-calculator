import { listCountries, listSubdivisions } from './tariffs';

export interface TariffPageRef {
  path: string;
  iso2: string;
  subdivisionCode?: string;
  label: string;
}

/**
 * Every location that gets a prerendered `/cost/...` page: one per bundled
 * country plus one per subdivision the schedule carries (Indian states and US
 * states today). Labels read "Maharashtra, India" for subdivisions and just the
 * country name otherwise.
 */
export function listTariffPages(): TariffPageRef[] {
  const pages: TariffPageRef[] = [];

  for (const country of listCountries()) {
    const iso2 = country.iso2.toLowerCase();
    pages.push({
      path: `/cost/${iso2}`,
      iso2: country.iso2,
      label: country.name,
    });

    for (const subdivision of listSubdivisions(country.iso2)) {
      pages.push({
        path: `/cost/${iso2}/${subdivision.code.slice(country.iso2.length + 1).toLowerCase()}`,
        iso2: country.iso2,
        subdivisionCode: subdivision.code,
        label: `${subdivision.name}, ${country.name}`,
      });
    }
  }

  return pages;
}
