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
        lede="Who makes it, why it's free, how the estimate is built, and where to check our figures."
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

      <Section title="Why this exists">
        <div className="space-y-3">
          <p className={BODY}>
            I built PC Power Calculator because the cost of running a computer is invisible when
            you buy it. Comparing two graphics cards takes seconds; working out what either will
            add to your electricity bill usually means a spreadsheet, a guess at your tariff and a
            hunt through the manual for wattages.
          </p>
          <p className={BODY}>
            This calculator puts the answer in one place: real component specifications, the way
            you actually use the machine, and the tariff where you live. Open it, add your parts,
            and get a number you can question, check and share — without an account.
          </p>

          <div className={`${TILE} mt-4`}>
            <p className={EYEBROW}>Built by</p>
            <p className="mt-1 font-display text-sm font-bold">Amit Haridas · ConcreteInfo</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              PC Power Calculator is an independent project by Amit Haridas, built at{' '}
              <a
                href="https://www.concreteinfo.in"
                target="_blank"
                rel="noopener noreferrer"
                className={LINK}
              >
                ConcreteInfo
              </a>
              , which makes practical software for construction and engineering teams. The same
              idea applies here: clear numbers, sources you can check, and no sales pitch.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Why it is free">
        <div className="space-y-3">
          <p className={BODY}>
            The answer should not depend on whether you can afford a subscription. This site is
            built as static pages with its component and tariff data bundled at build time, so
            serving it costs very little and there is no per-user cost to recover.
          </p>
          <p className={BODY}>
            There are no accounts, no paywall, and builds never leave your browser. If advertising
            is ever switched on, it will be clearly labelled, consent-gated, and never placed
            between you and the result.
          </p>
          <p className={BODY}>
            Being free is what lets a first-time builder, a student, a small office or someone
            running a home server use the same numbers as a professional — and that is the point.
          </p>
        </div>
      </Section>

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
          <Link className={LINK} to="/suggest">
            the suggestions form
          </Link>{' '}
          — especially new countries, states and components.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            to="/suggest"
            className="bg-brand-dark text-white hover:bg-brand rounded-8 min-h-11 px-4 inline-flex items-center text-sm font-semibold"
          >
            Suggest a component
          </Link>
          <Link
            to="/feedback"
            className="text-sm font-semibold text-brand-text hover:underline"
          >
            Send feedback
          </Link>
          <Link to="/" className="text-sm font-semibold text-brand-text hover:underline">
            Back to the calculator
          </Link>
        </div>
      </Section>
    </div>
  );
}
