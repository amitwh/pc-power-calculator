import { useLegacyTable, getCoreRowModel } from '@tanstack/react-table/legacy';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { flexRender } from '@tanstack/react-table';
import { listWorkloads } from '@/lib/data/workloads';
import { findCurrency } from '@/lib/data/currencies';
import { compareBuilds } from '@/lib/calc/compare';
import type { ComparisonRow } from '@/lib/calc/compare';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';
import { formatCost, formatKwh } from '@/lib/calc/format';

interface Props {
  builds: BuildConfig[];
  /** Currency to use for the cost column. Falls back to the first build's override, then INR. */
  currency?: CurrencyInfo;
}

const DEFAULT_INR: CurrencyInfo = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
  decimalDigits: 0,
};

export function ComparisonTable({ builds, currency }: Props) {
  const workloads = listWorkloads();
  const result = compareBuilds(builds, workloads, 'year');

  const resolvedCurrency: CurrencyInfo =
    currency ?? findCurrency(builds[0]?.currency_override ?? '') ?? DEFAULT_INR;

  const columns: LegacyColumnDef<ComparisonRow>[] = [
    { accessorKey: 'workload_id', header: 'Workload' },
    ...builds.flatMap((b) => [
      {
        id: `${b.id}-kwh`,
        header: `${b.name} (kWh)`,
        cell: ({ row }: { row: { original: ComparisonRow } }) =>
          formatKwh(row.original.perBuildKwh[b.id] ?? 0, 0),
        meta: { numeric: true },
      },
      {
        id: `${b.id}-cost`,
        header: `${b.name} (cost)`,
        cell: ({ row }: { row: { original: ComparisonRow } }) =>
          formatCost(row.original.perBuildCost[b.id] ?? 0, resolvedCurrency),
        meta: { numeric: true },
      },
      {
        id: `${b.id}-perf`,
        header: `${b.name} perf`,
        cell: ({ row }: { row: { original: ComparisonRow } }) => {
          const metrics = row.original.perBuildPerf?.[b.id] ?? [];
          return metrics.length === 0
            ? '—'
            : metrics.map((m) => `${m.value}${m.unit}`).join(' · ');
        },
        meta: { numeric: true },
      },
    ]),
  ];

  const table = useLegacyTable({
    data: result.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-numeric tabular-nums">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-gray-200 dark:border-gray-800">
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="text-left p-2 font-display text-sm"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 dark:border-gray-900">
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="p-2 text-sm">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-brand font-semibold">
            <td className="p-2">Yearly total</td>
            {builds.flatMap((b) => {
              const t = result.totals.find((x) => x.buildId === b.id)!;
              return [
                <td key={`${b.id}-yk`} className="p-2">
                  {formatKwh(t.kwh, 0)}
                </td>,
                <td key={`${b.id}-yc`} className="p-2 text-brand">
                  {formatCost(t.cost, resolvedCurrency)}
                </td>,
                <td key={`${b.id}-yp`} className="p-2 text-gray-500">—</td>,
              ];
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
