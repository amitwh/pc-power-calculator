import ReactApexChart from 'react-apexcharts';
import type { Component } from '@/types/component';

interface Props {
  components: Component[];
  drawWByComponentId: Record<string, number>;
}

const PALETTE = ['#e5461f', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function PowerBreakdown({ components, drawWByComponentId }: Props) {
  const labels = components.map((c) => `${c.brand} ${c.model}`);
  const series = components.map((c) => Math.round(drawWByComponentId[c.id] ?? 0));

  return (
    <ReactApexChart
      type="donut"
      width="100%"
      height={260}
      options={{
        chart: { background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
        labels,
        colors: PALETTE,
        legend: { position: 'bottom' },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '65%' } } },
        responsive: [{ breakpoint: 768, options: { legend: { position: 'bottom' } } }],
        stroke: { width: 2, colors: ['transparent'] },
      }}
      series={series}
    />
  );
}
