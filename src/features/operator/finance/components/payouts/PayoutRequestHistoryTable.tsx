'use client';

import {
  formatFinanceDateTime,
  formatVndCurrency,
} from '../../utils/financeFormat';
import { financeEn } from '../../resources/en';
import type { PayoutRequestDto } from '../../types/payoutLifecycle';

interface PayoutRequestHistoryTableProps {
  requests: PayoutRequestDto[];
  onCancelRequest: (request: PayoutRequestDto) => void;
  isLoading?: boolean;
}

export function PayoutRequestHistoryTable({
  requests,
  onCancelRequest,
  isLoading = false,
}: PayoutRequestHistoryTableProps) {
  const getStatusBadge = (status: PayoutRequestDto['status']) => {
    switch (status) {
      case 'Pending Confirmation':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {financeEn.payouts.history.statusPending}
          </span>
        );
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {financeEn.payouts.history.statusSettled}
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {financeEn.payouts.history.statusRejected}
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {financeEn.payouts.history.statusCancelled}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-[#00152A]">
          {financeEn.payouts.history.title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {financeEn.payouts.history.subtitle}
        </p>
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
                <th scope="col" className="px-4 py-3">
                  {financeEn.payouts.history.colRequestCode}
                </th>
                <th scope="col" className="px-4 py-3">
                  {financeEn.payouts.history.colPeriod}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.history.colRequestedAmount}
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  {financeEn.payouts.history.colStatus}
                </th>
                <th scope="col" className="px-4 py-3">
                  {financeEn.payouts.history.colRequestedDate}
                </th>
                <th scope="col" className="px-4 py-3">
                  {financeEn.payouts.history.colSettledDate}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {financeEn.payouts.history.colActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
              {requests.map((req) => {
                const canCancel = req.status === 'Pending Confirmation';

                return (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono text-[#00152A]">
                      {req.requestCode}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      {req.periodLabel}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#006B5F]">
                      {formatVndCurrency(req.requestedAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatFinanceDateTime(req.requestedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {req.settledAt ? formatFinanceDateTime(req.settledAt) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => onCancelRequest(req)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            close
                          </span>
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
