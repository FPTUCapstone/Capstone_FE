'use client';

import { useState } from 'react';
import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type { RevenueChartDataPoint } from '../../types/revenueLifecycle';

interface RevenueChartProps {
  chartData: RevenueChartDataPoint[];
}

export function RevenueChart({ chartData }: RevenueChartProps) {
  const [showTableFallback, setShowTableFallback] = useState(false);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center">
        <h3 className="text-sm font-bold text-[#00152A]">
          {financeEn.revenue.chart.title}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {financeEn.revenue.chart.subtitle}
        </p>
        <div className="my-8 flex flex-col items-center justify-center text-slate-400">
          <span className="material-symbols-outlined text-4xl">bar_chart</span>
          <p className="mt-2 text-xs">{financeEn.revenue.chart.emptyChart}</p>
        </div>
      </div>
    );
  }

  // Calculate scaling max value
  const maxGross = Math.max(
    ...chartData.map((d) => Math.max(d.grossRevenue, d.netAmount)),
    1
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#00152A]">
            {financeEn.revenue.chart.title}
          </h3>
          <p className="text-xs text-slate-500">
            {financeEn.revenue.chart.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 inline-block" />
              Gross
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#006B5F] inline-block" />
              Net
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-amber-500 inline-block" />
              Commission
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTableFallback(!showTableFallback)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            aria-expanded={showTableFallback}
          >
            {financeEn.revenue.chart.toggleTable}
          </button>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div
        className="mt-6 overflow-x-auto"
        role="region"
        aria-label={financeEn.revenue.chart.ariaChartLabel}
      >
        <div className="min-w-[500px] h-64 flex items-end gap-6 px-4 pb-8 pt-4 border-b border-slate-100 relative">
          {/* Background grid lines */}
          <div className="absolute inset-x-0 top-4 border-t border-slate-100 pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 border-t border-slate-100 pointer-events-none" />

          {chartData.map((pt, i) => {
            const grossHeightPct = Math.min(100, (pt.grossRevenue / maxGross) * 100);
            const netHeightPct = Math.min(100, (pt.netAmount / maxGross) * 100);
            const commHeightPct = Math.min(100, (pt.commission / maxGross) * 100);

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 transition-opacity bg-slate-900 text-white rounded-md px-2 py-1 text-[10px] whitespace-nowrap shadow-md">
                  <p className="font-bold">{pt.periodLabel}</p>
                  <p>Gross: {formatVndCurrency(pt.grossRevenue)}</p>
                  <p>Net: {formatVndCurrency(pt.netAmount)}</p>
                  <p>Commission: {formatVndCurrency(pt.commission)}</p>
                </div>

                {/* Bars group */}
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  {/* Gross Bar */}
                  <div
                    style={{ height: `${Math.max(4, grossHeightPct)}%` }}
                    className="w-4 rounded-t-sm bg-emerald-500 transition-all hover:bg-emerald-600"
                    title={`Gross: ${formatVndCurrency(pt.grossRevenue)}`}
                  />
                  {/* Net Bar */}
                  <div
                    style={{ height: `${Math.max(4, netHeightPct)}%` }}
                    className="w-4 rounded-t-sm bg-[#006B5F] transition-all hover:bg-[#005249]"
                    title={`Net: ${formatVndCurrency(pt.netAmount)}`}
                  />
                  {/* Commission Bar */}
                  <div
                    style={{ height: `${Math.max(4, commHeightPct)}%` }}
                    className="w-3 rounded-t-sm bg-amber-400 transition-all hover:bg-amber-500"
                    title={`Commission: ${formatVndCurrency(pt.commission)}`}
                  />
                </div>

                {/* X-axis Label */}
                <span className="absolute -bottom-6 text-[10px] font-semibold text-slate-500 truncate max-w-[80px]">
                  {pt.periodLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accessible Table Fallback */}
      {showTableFallback && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <caption className="sr-only">
              {financeEn.revenue.chart.ariaChartLabel}
            </caption>
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  {financeEn.revenue.chart.periodHeader}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  {financeEn.revenue.chart.grossHeader}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  {financeEn.revenue.chart.refundsHeader}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  {financeEn.revenue.summary.platformCommission}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  {financeEn.revenue.chart.netHeader}
                </th>
                <th scope="col" className="px-4 py-2.5 text-center">
                  {financeEn.revenue.chart.bookingsHeader}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
              {chartData.map((pt, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {pt.periodLabel}
                  </td>
                  <td className="px-4 py-2 text-right text-emerald-700 font-medium">
                    {formatVndCurrency(pt.grossRevenue)}
                  </td>
                  <td className="px-4 py-2 text-right text-rose-600 font-medium">
                    {formatVndCurrency(pt.refundedAmount)}
                  </td>
                  <td className="px-4 py-2 text-right text-amber-700 font-medium">
                    {formatVndCurrency(pt.commission)}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-[#006B5F]">
                    {formatVndCurrency(pt.netAmount)}
                  </td>
                  <td className="px-4 py-2 text-center">{pt.bookingsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
