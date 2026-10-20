'use client';

import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type { RevenueSummaryDto } from '../../types/revenueLifecycle';

interface SettlementDetailsCardProps {
  summary: RevenueSummaryDto;
}

/**
 * SRS §3.8.5.1 Screen Layout, Middle Section (right column): shows the settlement math
 * (Payments Received - Refunds - Commission = Net Payout) with Gross Revenue and Discounts
 * Given as supporting figures, alongside the time-series chart.
 */
export function SettlementDetailsCard({ summary }: SettlementDetailsCardProps) {
  const t = financeEn.revenue.settlement;

  const rows: Array<{ label: string; value: number; variant?: 'supporting' | 'deduction' | 'subtotal' | 'total' }> = [
    { label: t.grossRevenue, value: summary.grossRevenue, variant: 'supporting' },
    { label: t.discountsGiven, value: -summary.discountsGiven, variant: 'deduction' },
    { label: t.paymentsReceived, value: summary.paymentsReceived, variant: 'subtotal' },
    { label: t.refundedAmount, value: -summary.refundedAmount, variant: 'deduction' },
    { label: t.netSales, value: summary.netSales, variant: 'subtotal' },
    { label: t.platformCommission, value: -summary.platformCommission, variant: 'deduction' },
    { label: t.netPayout, value: summary.netAmount, variant: 'total' },
  ];

  return (
    <section
      aria-label={t.title}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <h3 className="text-sm font-bold text-[#00152A]">{t.title}</h3>
      <p className="mt-1 text-xs text-slate-500">{t.subtitle}</p>

      <dl className="mt-4 flex-1 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between text-xs ${
              row.variant === 'total'
                ? 'mt-2 border-t border-slate-200 pt-3 text-sm font-bold text-[#006B5F]'
                : row.variant === 'subtotal'
                  ? 'border-t border-slate-100 pt-2 font-semibold text-[#00152A]'
                  : 'text-slate-500'
            }`}
          >
            <dt>{row.label}</dt>
            <dd
              className={
                row.variant === 'deduction' && row.value !== 0
                  ? 'text-rose-600'
                  : undefined
              }
            >
              {row.variant === 'deduction' && row.value !== 0
                ? `(${formatVndCurrency(Math.abs(row.value))})`
                : formatVndCurrency(row.value)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-[10px] text-slate-400 leading-tight">{t.formulaHint}</p>
    </section>
  );
}
