'use client';

import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type { RevenueSummaryDto } from '../../types/revenueLifecycle';

interface RevenueSummaryCardsProps {
  summary: RevenueSummaryDto;
}

export function RevenueSummaryCards({ summary }: RevenueSummaryCardsProps) {
  const cards = [
    {
      title: financeEn.revenue.summary.grossRevenue,
      value: formatVndCurrency(summary.grossRevenue),
      help: financeEn.revenue.summary.grossRevenueHelp,
      icon: 'payments',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      title: financeEn.revenue.summary.platformCommission,
      value: formatVndCurrency(summary.platformCommission),
      help: financeEn.revenue.summary.platformCommissionHelp.replace(
        '{rate}',
        String(summary.commissionRatePercent)
      ),
      icon: 'percent',
      color: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      title: financeEn.revenue.summary.netAmount,
      value: formatVndCurrency(summary.netAmount),
      help: financeEn.revenue.summary.netAmountHelp,
      icon: 'account_balance_wallet',
      color: 'text-[#006B5F] bg-[#006B5F]/5 border-[#006B5F]/20',
      highlight: true,
    },
    {
      title: financeEn.revenue.summary.totalBookings,
      value: summary.totalBookings.toLocaleString('vi-VN'),
      help: financeEn.revenue.summary.totalBookingsHelp,
      icon: 'receipt_long',
      color: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    {
      title: financeEn.revenue.summary.totalParticipants,
      value: summary.totalParticipants.toLocaleString('vi-VN'),
      help: financeEn.revenue.summary.totalParticipantsHelp,
      icon: 'group',
      color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    },
    {
      title: financeEn.revenue.summary.refundedAmount,
      value: formatVndCurrency(summary.refundedAmount),
      help: financeEn.revenue.summary.refundedAmountHelp,
      icon: 'replay',
      color: 'text-rose-700 bg-rose-50 border-rose-100',
    },
  ];

  return (
    <section aria-label="Revenue Summary Metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-shadow hover:shadow-sm ${
            card.highlight
              ? 'border-[#006B5F]/30 bg-white ring-1 ring-[#006B5F]/20'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 truncate">
              {card.title}
            </span>
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${card.color}`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {card.icon}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-[#00152A] tracking-tight truncate">
              {card.value}
            </p>
            <p className="mt-1 text-[10px] text-slate-400 leading-tight">
              {card.help}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
