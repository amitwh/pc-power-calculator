import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';

const LINK = 'text-brand-text underline underline-offset-2';
const BODY = 'text-sm leading-relaxed';
const TILE = 'rounded-12 bg-gray-50 p-4 dark:bg-gray-900';
const EYEBROW = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400';

/** One prose block: a rule, a display heading, then breathing room. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function About() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader
        title="About & Methodology"
        lede="How the estimate is built — the formula, the data behind it, and where to check our figures."
      />

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className={TILE}>
          <dt className="font-display text-sm font-bold">Local-first</dt>
          <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Builds stay in your browser — nothing is uploaded.
          </dd>
        </div>
        <div className={TILE}>
          <dt className="font-display text-sm font-bold">80 PLUS</dt>
          <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            PSU efficiency curves modelled at real load.
          </dd>
        </div>
        <div className={TILE}>
          <dt className="font-display text-sm font-bold">Public data</dt>
          <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manufacturer specs and utility tariffs, listed below.
          </dd>
        </div>
      </dl>

      <Section title="How we calculate">
        <div className={TILE}>
          <p className={EYEBROW}>The formula</p>
          <div className="mt-2 space-y-2">
            <p className={BODY}>Per-component power at a workload is computed as:</p>
            <pre className="overflow-x-auto font-numeric text-xs sm:text-sm">
              P(w) = P_idle + (P_tdp − P_idle) × util(w)
            </pre>
            <p className={BODY}>
              PSU efficiency is interpolated from the 80+ curve for the rating tier and load
              percentage. Wall draw = component sum ÷ efficiency.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Data sources">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className={TILE}>
            <dt className="font-display text-sm font-bold">Component specs</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manufacturer pages, TechPowerUp database
            </dd>
          </div>
          <div className={TILE}>
            <dt className="font-display text-sm font-bold">Electricity tariffs</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Public utility regulators (CEA, EIA, Ofgem, Eurostat)
            </dd>
          </div>
          <div className={TILE}>
            <dt className="font-display text-sm font-bold">FX rates</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Bundled snapshot (refreshed as part of the data-freshness workflow)
            </dd>
          </div>
          <div className={TILE}>
            <dt className="font-display text-sm font-bold">Benchmarks</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              TechPowerUp, Gamers Nexus, Blender Open Data, PassMark, WhatToMine
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Disclaimer">
        <div className={TILE}>
          <p className={EYEBROW}>Estimates only</p>
          <p className={`mt-2 ${BODY}`}>
            All figures on this site — power draw, energy use, running cost, PSU sizing — are{' '}
            <strong>estimates for information only</strong> and are not professional, electrical or
            financial advice. Spec values are compiled from public sources and may be incomplete,
            rounded or out of date; always verify against the manufacturer's datasheet before
            purchase. For electrical work, UPS/inverter sizing or wiring decisions, consult a
            qualified electrician. Tariff and FX data change frequently — your actual electricity
            bill is always the ground truth. The service is provided “as is”, without warranty of any
            kind.
          </p>
        </div>
      </Section>

      <Section title="Trademarks">
        <p className={BODY}>
          All product names, logos, brands and trademarks (Intel, AMD, NVIDIA, Corsair, and every
          other manufacturer mentioned) are the property of their respective owners. They are used
          on this site solely to identify hardware components. PC Power Calculator is an
          independent project and is <strong>not affiliated with, sponsored, or endorsed by</strong>{' '}
          any hardware manufacturer or utility.
        </p>
      </Section>

      <Section title="Privacy">
        <p className={BODY}>
          Builds live only in your browser's local storage — nothing is uploaded. Details on
          analytics, ads and your choices:{' '}
          <Link to="/privacy" className={LINK}>
            Privacy policy
          </Link>
          .
        </p>
      </Section>

      <Section title="Contribute">
        <p className={BODY}>
          Corrections and additions are welcome through{' '}
          <Link className={LINK} to="/suggestions">
            the suggestions form
          </Link>{' '}
          — especially new countries, states and components.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            to="/suggestions"
            className="bg-brand-dark text-white hover:bg-brand rounded-8 min-h-11 px-4 inline-flex items-center text-sm font-semibold"
          >
            Suggest a component
          </Link>
          <Link to="/" className="text-sm font-semibold text-brand-text hover:underline">
            Back to the calculator
          </Link>
        </div>
      </Section>
    </div>
  );
}
