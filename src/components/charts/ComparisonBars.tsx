import ReactApexChart from 'react-apexcharts';

export interface ComparisonBarsDatum {
  id: string;
  name: string;
  yearlyKwh: number;
}

interface Props {
  builds: ComparisonBarsDatum[];
}

const PALETTE = ['#e5461f', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * Bar chart that places every build's yearly kWh side by side on the same axis
 * so the user can eyeball which system draws the most electricity.
 *
 * One bar per build (single series) — keeps the chart readable when comparing
 * 2–8 systems; for a true multi-series breakdown, see PowerBreakdown.
 */
export function ComparisonBars({ builds }: Props) {
  const categories = builds.map((b) => b.name);
  const seriesData = builds.map((b) => Math.round(b.yearlyKwh));
  const colors = builds.map((_, i) => PALETTE[i % PALETTE.length]);

  return (
    <ReactApexChart
      type="bar"
      width="100%"
      height={280}
      options={{
        chart: {
          background: 'transparent',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          toolbar: { show: false },
        },
        colors,
        plotOptions: {
          bar: {
            borderRadius: 8,
            columnWidth: '55%',
            distributed: true,
          },
        },
        legend: { show: false },
        dataLabels: {
          enabled: true,
          style: { fontSize: '12px', fontWeight: 600 },
          formatter: (val: number) => `${val.toLocaleString('en-IN')} kWh`,
        },
        xaxis: {
          categories,
          labels: {
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px' },
          },
        },
        yaxis: {
          title: { text: 'Yearly kWh', style: { fontSize: '12px' } },
          labels: {
            formatter: (val: number) => `${Math.round(val).toLocaleString('en-IN')}`,
          },
        },
        grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
        tooltip: {
          y: { formatter: (val: number) => `${val.toLocaleString('en-IN')} kWh` },
        },
      }}
      series={[{ name: 'Yearly kWh', data: seriesData }]}
    />
  );
}
