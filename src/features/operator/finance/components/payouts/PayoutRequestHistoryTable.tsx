'use client';

import { formatFinanceDateTime, formatVndCurrency } from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type { PayoutHistoryItemDto, PayoutStatus } from '../../types/payoutLifecycle';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatPeriodLabel(periodStart: string, periodEnd: string): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const startLabel = `${MONTH_LABELS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
  if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()) {
    return startLabel;
  }
  return `${startLabel} – ${MONTH_LABELS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
}

interface PayoutRequestHistoryTableProps {
  requests: PayoutHistoryItemDto[];
  onCancelRequest: (request: PayoutHistoryItemDto) => void;
  isLoading?: boolean;
}

const STATUS_STYLE: Record<PayoutStatus, { bg: string; dot: string; label: string }> = {
  PendingReview: { bg: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', label: financeEn.payouts.history.statusPendingReview },
  ApprovedForSettlement: { bg: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', label: financeEn.payouts.history.statusApprovedForSettlement },
  SettlementProcessing: { bg: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', label: financeEn.payouts.history.statusSettlementProcessing },
  Settled: { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: financeEn.payouts.history.statusSettled },
  SettlementFailed: { bg: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', label: financeEn.payouts.history.statusSettlementFailed },
  Rejected: { bg: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', label: financeEn.payouts.history.statusRejected },
  Cancelled: { bg: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', label: financeEn.payouts.history.statusCancelled },
};

export function PayoutRequestHistoryTable({ requests, onCancelRequest }: PayoutRequestHistoryTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-[#00152A]">{financeEn.payouts.history.title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{financeEn.payouts.history.subtitle}</p>
      </div>

      {requests.length === 0 ? (
        <div className="my-8 flex flex-col items-center justify-center text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl">history</span>
          <p className="mt-2 text-xs">{financeEn.payouts.history.emptyHistory}</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3">{financeEn.payouts.history.colPayoutCode}</th>
                <th scope="col" className="px-4 py-3">{financeEn.payouts.history.colPeriod}</th>
                <th scope="col" className="px-4 py-3 text-right">{financeEn.payouts.history.colPayable}</th>
                <th scope="col" className="px-4 py-3 text-center">{financeEn.payouts.history.colStatus}</th>
                <th scope="col" className="px-4 py-3">{financeEn.payouts.history.colRequestedDate}</th>
                <th scope="col" className="px-4 py-3">{financeEn.payouts.history.colSettledDate}</th>
                <th scope="col" className="px-4 py-3 text-right">{financeEn.payouts.history.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
              {requests.map((req) => {
                const style = STATUS_STYLE[req.status];
                return (
                  <tr key={req.payoutCode} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono text-[#00152A]">{req.payoutCode}</td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {formatPeriodLabel(req.periodStart, req.periodEnd)}
                      {req.periodCount > 1 && (
                        <span className="ml-1.5 text-[10px] font-semibold text-slate-400">
                          ({req.periodCount} {financeEn.payouts.history.periodMonthsSuffix})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#006B5F]">
                      {formatVndCurrency(req.payableNetAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                      {req.status === 'Rejected' && req.rejectionReason && (
                        <p className="mt-1 text-[10px] text-rose-600">{req.rejectionReason}</p>
                      )}
                      {req.status === 'SettlementFailed' && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {financeEn.payouts.history.settlementFailedNotice}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {req.requestedAtUtc ? formatFinanceDateTime(req.requestedAtUtc) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {req.settledAtUtc ? formatFinanceDateTime(req.settledAtUtc) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {req.cancellable && (
                        <button
                          type="button"
                          onClick={() => onCancelRequest(req)}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          <span>{financeEn.payouts.history.btnCancelRequest}</span>
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
