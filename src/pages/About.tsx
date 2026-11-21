import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';

/** Separator between prose sections: a rule, not a card. */
const SECTION = 'border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0';
const BODY = 'mt-2 text-sm leading-relaxed';
const LINK = 'text-brand-text underline underline-offset-2';

export default function About() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader title="About & Methodology" />

      <section className={SECTION}>
        <h2 className="text-base font-semibold">How we calculate</h2>
        <div className={BODY}>
          <p>Per-component power at a workload is computed as:</p>
          <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-8 my-2">
            P(w) = P_idle + (P_tdp − P_idle) × util(w)
          </pre>
          <p>
            PSU efficiency is interpolated from the 80+ curve for the rating tier and load
            percentage. Wall draw = component sum ÷ efficiency.
          </p>
        </div>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Data sources</h2>
        <ul className={`${BODY} list-disc pl-5 space-y-1`}>
          <li>Component specs — manufacturer pages, TechPowerUp database</li>
          <li>Electricity tariffs — public utility regulators (CEA, EIA, Ofgem, Eurostat)</li>
          <li>FX rates — bundled snapshot (refreshed as part of the data-freshness workflow)</li>
          <li>Benchmarks — TechPowerUp, Gamers Nexus, Blender Open Data, PassMark, WhatToMine</li>
        </ul>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Disclaimer</h2>
        <p className={BODY}>
          All figures on this site — power draw, energy use, running cost, PSU sizing — are{' '}
          <strong>estimates for information only</strong> and are not professional, electrical or
          financial advice. Spec values are compiled from public sources and may be incomplete,
          rounded or out of date; always verify against the manufacturer's datasheet before
          purchase. For electrical work, UPS/inverter sizing or wiring decisions, consult a
          qualified electrician. Tariff and FX data change frequently — your actual electricity
          bill is always the ground truth. The service is provided “as is”, without warranty of any
          kind.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Trademarks</h2>
        <p className={BODY}>
          All product names, logos, brands and trademarks (Intel, AMD, NVIDIA, Corsair, and every
          other manufacturer mentioned) are the property of their respective owners. They are used
          on this site solely to identify hardware components. PC Power Calculator is an
          independent project and is <strong>not affiliated with, sponsored, or endorsed by</strong>{' '}
          any hardware manufacturer or utility.
        </p>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Privacy</h2>
        <p className={BODY}>
          Builds live only in your browser's local storage — nothing is uploaded. Details on
          analytics, ads and your choices:{' '}
          <Link to="/privacy" className={LINK}>
            Privacy policy
          </Link>
          .
        </p>
      </section>

      <section className={SECTION}>
        <h2 className="text-base font-semibold">Contribute</h2>
        <p className={BODY}>
          Corrections and additions are welcome through{' '}
          <Link className={LINK} to="/suggestions">the suggestions form</Link> — especially new
          countries, states and components.
        </p>
      </section>
    </div>
  );
}
