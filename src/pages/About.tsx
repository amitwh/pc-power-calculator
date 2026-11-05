import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';

export default function About() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">About & Methodology</h1>
      <Card>
        <CardTitle>How we calculate</CardTitle>
        <p className="text-sm">Per-component power at a workload is computed as:</p>
        <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-8 my-2">P(w) = P_idle + (P_tdp − P_idle) × util(w)</pre>
        <p className="text-sm">PSU efficiency is interpolated from the 80+ curve for the rating tier and load percentage. Wall draw = component sum ÷ efficiency.</p>
      </Card>
      <Card>
        <CardTitle>Data sources</CardTitle>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>Component specs — manufacturer pages, TechPowerUp database</li>
          <li>Electricity tariffs — public utility regulators (CEA, EIA, Ofgem, Eurostat)</li>
          <li>FX rates — bundled snapshot (refreshed as part of the data-freshness workflow)</li>
          <li>Benchmarks — TechPowerUp, Gamers Nexus, Blender Open Data, PassMark, WhatToMine</li>
        </ul>
      </Card>
      <Card>
        <CardTitle>Disclaimer</CardTitle>
        <p className="text-sm">
          All figures on this site — power draw, energy use, running cost, PSU sizing — are{' '}
          <strong>estimates for information only</strong> and are not professional, electrical or
          financial advice. Spec values are compiled from public sources and may be incomplete,
          rounded or out of date; always verify against the manufacturer's datasheet before
          purchase. For electrical work, UPS/inverter sizing or wiring decisions, consult a
          qualified electrician. Tariff and FX data change frequently — your actual electricity
          bill is always the ground truth. The service is provided “as is”, without warranty of any
          kind.
        </p>
      </Card>
      <Card>
        <CardTitle>Trademarks</CardTitle>
        <p className="text-sm">
          All product names, logos, brands and trademarks (Intel, AMD, NVIDIA, Corsair, and every
          other manufacturer mentioned) are the property of their respective owners. They are used
          on this site solely to identify hardware components. PC Power Calculator is an
          independent project and is <strong>not affiliated with, sponsored, or endorsed by</strong>{' '}
          any hardware manufacturer or utility.
        </p>
      </Card>
      <Card>
        <CardTitle>Privacy</CardTitle>
        <p className="text-sm">
          Builds live only in your browser's local storage — nothing is uploaded. Details on
          analytics, ads and your choices:{' '}
          <Link to="/privacy" className="text-brand-text underline underline-offset-2">
            Privacy policy
          </Link>
          .
        </p>
      </Card>
      <Card>
        <CardTitle>Contribute</CardTitle>
        <p className="text-sm">PRs welcome on <a className="text-brand-text underline underline-offset-2" href="https://github.com/amitwh/pc-power-calculator">github.com/amitwh/pc-power-calculator</a>. Especially: new countries / states / components.</p>
      </Card>
    </div>
  );
}
