'use client';

import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type { SettlementMonthDto } from '../../types/payoutLifecycle';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COVERAGE_BADGE: Record<SettlementMonthDto['coverage'], { text: string; className: string }> = {
  Open: { text: financeEn.payouts.months.coverageOpen, className: 'bg-amber-50 text-amber-700' },
  AvailableBalance: { text: financeEn.payouts.months.coverageAvailable, className: 'bg-[#006B5F]/10 text-[#006B5F]' },
  IncludedInPayout: { text: financeEn.payouts.months.coverageIncluded, className: 'bg-slate-100 text-slate-600' },
};

interface SettlementMonthsTableProps {
  months: SettlementMonthDto[];
  year: number;
  onYearChange: (year: number) => void;
  isLoading?: boolean;
}

export function SettlementMonthsTable({
  months,
  year,
  onYearChange,
  isLoading,
}: SettlementMonthsTableProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#00152A]">
            {financeEn.payouts.months.title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {financeEn.payouts.months.subtitle}
          </p>
        </div>
        <div>
          <label htmlFor="settlement-year" className="sr-only">
            {financeEn.payouts.months.yearLabel}
          </label>
          <select
            id="settlement-year"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#006B5F] focus:outline-hidden"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isLoading && months.length === 0 ? (
        <div className="my-8 flex flex-col items-center justify-center text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl">date_range</span>
          <p className="mt-2 text-xs">{financeEn.payouts.months.emptyMonths}</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {financeEn.payouts.months.colMonth}
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  {financeEn.payouts.months.colEligibleBookings}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.months.colPayments}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.months.colRefunded}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.months.colCommission}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.months.colPayable}
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  {financeEn.payouts.months.colStatus}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.months.colCoverage}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
              {months.map((month) => {
                const isClosed = month.monthStatus === 'Closed';
                const monthKey = `${month.year}-${month.month}`;
                const badge = COVERAGE_BADGE[month.coverage] ?? COVERAGE_BADGE.Open;

                return (
                  <tr key={monthKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-[#00152A]">
                      {MONTH_LABELS[month.month - 1]} {month.year}
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium">
                      {month.eligibleBookingCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                      {formatVndCurrency(month.paymentsReceived)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-rose-600">
                      {formatVndCurrency(month.refundedAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-amber-700">
                      {formatVndCurrency(month.commissionAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#006B5F]">
                      {formatVndCurrency(month.payableNetAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isClosed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {isClosed ? financeEn.payouts.months.statusClosed : financeEn.payouts.months.statusOpen}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                          {badge.text}
                        </span>
                        {month.payoutCode && (
                          <span className="text-[11px] font-mono text-slate-500">{month.payoutCode}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
