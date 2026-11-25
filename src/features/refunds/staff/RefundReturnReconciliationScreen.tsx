'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { formatVietnamDateTime, formatVnd, type RefundListResponse } from '../types/refundLifecycle';
import { fetchReturnReportedRefunds, markRefundReturnReceived, RefundsAdminError } from '../admin/refundsAdminService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'unavailable';

/** UC-42 screen 100 (SRS 3.8.4.3, step 7): Staff records that a Tour Operator's reported return
 * has been fully credited, which the backend turns into `ReturnReceived` and triggers UC-67. No
 * confirmation dialog — the Staff action already requires navigating into this one screen and
 * clicking a named button, and recording a bank reconciliation already independently verified
 * against a real bank statement does not need a second in-app confirmation step (spec Screen 2). */
export function RefundReturnReconciliationScreen() {
  const { replace } = useRouter();
  const [data, setData] = useState<RefundListResponse | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [reloadToken, setReloadToken] = useState(0);
  const [rowError, setRowError] = useState<{ refundId: number; message: string } | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchReturnReportedRefunds(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setData(response);
          setState('ready');
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof RefundsAdminError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.refundReconciliation)}`);
          return;
        }
        setState(error instanceof RefundsAdminError && error.status === 403 ? 'forbidden' : 'unavailable');
      });
    return () => controller.abort();
  }, [replace, reloadToken]);

  async function handleConfirmReceipt(refundId: number) {
    setConfirmingId(refundId);
    setRowError(null);
    try {
      await markRefundReturnReceived(refundId);
      // Re-fetch rather than removing the row locally — the row disappears only after the
      // backend has actually committed `ReturnReceived` (spec Screen 2 acceptance criterion 4).
      setReloadToken((value) => value + 1);
    } catch (error) {
      setRowError({
        refundId,
        message: error instanceof RefundsAdminError ? error.message : 'The request could not be completed.',
      });
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 text-[#1C2928] md:px-8">
      <PageHeader
        className="mb-6"
        eyebrow="Refund (Web Administration)"
        title="Refund Return Reconciliation"
        description="Confirm receipt once a Tour Operator's reported return has been fully credited to the TripMate bank account."
      />

      {state === 'loading' ? <div role="status" className={panel}>Loading returns awaiting reconciliation…</div> : null}
      {state === 'forbidden' ? (
        <FeedbackAlert tone="error" title="Access denied">
          You do not have permission to access this function.
        </FeedbackAlert>
      ) : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load returns">
          <p>Please check your connection and try again.</p>
          <button type="button" onClick={() => setReloadToken((value) => value + 1)} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">
            Retry
          </button>
        </FeedbackAlert>
      ) : null}
      {state === 'ready' && data?.items.length === 0 ? <FeedbackAlert>No returns awaiting reconciliation.</FeedbackAlert> : null}
      {state === 'ready' && data && data.items.length > 0 ? (
        <div className="max-w-full overflow-x-auto rounded-2xl border border-[#DCE2DD] bg-white shadow-xs" tabIndex={0}>
          <table className="min-w-[900px] w-full text-left text-sm">
            <caption className="sr-only">Returns awaiting reconciliation</caption>
            <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              <tr>
                {['Refund Code', 'Booking Code', 'Tour Operator', 'Operator Share Amount', 'Return Reference', 'Reported At', 'Actions'].map((heading) => (
                  <th key={heading} scope="col" className={`px-4 py-3${heading === 'Operator Share Amount' ? ' text-right' : ''}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.refundId} className="border-t border-[#ECEEEB] transition hover:bg-[#F7F5EF]/50">
                  <td className="px-4 py-3 font-mono font-bold text-[#1C2928]">{item.refundId}</td>
                  <td className="px-4 py-3">{item.bookingCode}</td>
                  <td className="px-4 py-3">{item.tourOperatorUserId}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-bold">{formatVnd(item.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.returnReference ?? 'Not available'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.returnReportedAtUtc ? formatVietnamDateTime(item.returnReportedAtUtc) : 'Not available'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={confirmingId === item.refundId}
                      onClick={() => void handleConfirmReceipt(item.refundId)}
                      className="inline-flex whitespace-nowrap rounded-lg border border-[#174B4A] px-3 py-1.5 text-xs font-bold text-[#174B4A] transition hover:bg-[#E8F0EA] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {confirmingId === item.refundId ? 'Confirming…' : 'Confirm Receipt'}
                    </button>
                    {rowError?.refundId === item.refundId ? (
                      <p role="alert" className="mt-2 text-xs font-semibold text-[#8c1030]">
                        {rowError.message}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}

const panel = 'rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-[#5B6E69]';
