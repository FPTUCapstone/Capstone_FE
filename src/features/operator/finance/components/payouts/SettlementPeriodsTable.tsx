'use client';

import { formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import {
  PAYOUT_CONFIG,
  type SettlementPeriodDto,
} from '../../types/payoutLifecycle';

interface SettlementPeriodsTableProps {
  periods: SettlementPeriodDto[];
  onRequestPayout: (period: SettlementPeriodDto) => void;
  isLoading?: boolean;
}

export function SettlementPeriodsTable({
  periods,
  onRequestPayout,
  isLoading = false,
}: SettlementPeriodsTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-[#00152A]">
          {financeEn.payouts.periods.title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {financeEn.payouts.periods.subtitle}
        </p>
      </div>

      {periods.length === 0 ? (
        <div className="my-8 flex flex-col items-center justify-center text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl">
            date_range
          </span>
          <p className="mt-2 text-xs">{financeEn.payouts.periods.emptyPeriods}</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {financeEn.payouts.periods.colPeriod}
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  {financeEn.payouts.periods.colCompletedTours}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.periods.colGross}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.periods.colCommission}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.periods.colPayable}
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  {financeEn.payouts.periods.colStatus}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.periods.colAction}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
              {periods.map((period) => {
                const isClosed = period.status === 'Closed';
                const hasCompletedTours = period.completedToursCount > 0;
                const reachesMinimum =
                  period.payableNetAmount >=
                  PAYOUT_CONFIG.DEFAULT_MINIMUM_PAYOUT_AMOUNT;
                const hasPending = period.hasPendingPayout;

                const isEligible =
                  isClosed && hasCompletedTours && reachesMinimum && !hasPending;

                let disabledReason = '';
                if (!isClosed || !hasCompletedTours) {
                  disabledReason = financeEn.payouts.periods.ineligibleHelp;
                } else if (!reachesMinimum) {
                  disabledReason = financeEn.payouts.periods.belowMinHelp;
                } else if (hasPending) {
                  disabledReason = financeEn.payouts.periods.pendingExistsHelp;
                }

                return (
                  <tr
                    key={period.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-semibold text-[#00152A]">
                      <div>{period.periodLabel}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {period.periodCode}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium">
                      {period.completedToursCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                      {formatVndCurrency(period.grossRevenue)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-amber-700">
                      {formatVndCurrency(period.commission)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#006B5F]">
                      {formatVndCurrency(period.payableNetAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isClosed
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isClosed ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {isClosed
                          ? financeEn.payouts.periods.statusClosed
                          : financeEn.payouts.periods.statusOpen}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {hasPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-[14px]">
                            schedule
                          </span>
                          {financeEn.payouts.periods.badgePending}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRequestPayout(period)}
                          disabled={!isEligible || isLoading}
                          title={disabledReason}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#006B5F] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005249] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            send
                          </span>
                          <span>{financeEn.payouts.periods.btnRequestPayout}</span>
                        </button>
                      )}
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
