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
        <p className="text-sm">Numbers are estimates. Your actual electricity bill is the ground truth. Tariffs change frequently — always verify with your utility.</p>
      </Card>
      <Card>
        <CardTitle>Contribute</CardTitle>
        <p className="text-sm">PRs welcome on <a className="text-brand" href="https://github.com/amitwh/pc-power-calculator">github.com/amitwh/pc-power-calculator</a>. Especially: new countries / states / components.</p>
      </Card>
    </div>
  );
}