'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import {
  formatVietnamDateTime,
  formatVnd,
  type OperatorRefundListResponse,
  type RefundStatus,
} from '../types/refundLifecycle';
import { fetchOperatorRefunds, RefundsOperatorError } from './refundsOperatorService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'unavailable';
const PAGE_SIZE = 20;

/** What each status means for the Tour Operator; the first two are the ones it must act on. */
const STATUS_LABELS: Record<RefundStatus, string> = {
  PendingOperatorConfirmation: 'Awaiting your confirmation',
  AwaitingPartnerReturn: 'Awaiting your return transfer',
  ReturnReported: 'Return reported',
  ReturnReceived: 'Return received',
  Reconciliation: 'Under reconciliation',
  Escalated: 'Escalated',
  Pending: 'Refund queued',
  Processing: 'Refund processing',
  RetryPending: 'Refund retrying',
  ManualReview: 'Under review',
  Processed: 'Refunded',
  Failed: 'Failed',
  Rejected: 'Rejected',
};
const ACTION_REQUIRED: readonly RefundStatus[] = ['PendingOperatorConfirmation', 'AwaitingPartnerReturn'];
const NEGATIVE_STATUSES: readonly RefundStatus[] = ['Failed', 'Rejected'];
const WARNING_STATUSES: readonly RefundStatus[] = ['Escalated', 'ManualReview', 'RetryPending'];

function refundStatusBadgeClass(status: RefundStatus): string {
  if (NEGATIVE_STATUSES.includes(status)) {
    return 'border border-[#F7C9D3] bg-[#FDECEF] text-[#8C1030]';
  }
  if (ACTION_REQUIRED.includes(status) || WARNING_STATUSES.includes(status)) {
    return 'border border-[#F2D8B3] bg-[#FBF3E8] text-[#8F5419]';
  }
  return 'border border-[#CBE0D4] bg-[#E8F0EA] text-[#103B39]';
}

/**
 * The Tour Operator's own refund requests (UC-42), each linking to its Confirm Booking Refund
 * screen. Read-only: every action happens on that screen. The backend scopes the list to the
 * signed-in operator.
 */
export function OperatorRefundListScreen() {
  const [data, setData] = useState<OperatorRefundListResponse | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [pageNumber, setPageNumber] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchOperatorRefunds(pageNumber, PAGE_SIZE, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setData(response);
          setState('ready');
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        setState(error instanceof RefundsOperatorError && error.status === 403 ? 'forbidden' : 'unavailable');
      });
    return () => controller.abort();
  }, [pageNumber, reloadToken]);

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <section className="w-full text-[#1C2928]">
      <PageHeader
        className="mb-6"
        eyebrow="Bookings"
        title="Refund Requests"
        description="Refunds of your cancelled bookings. Open a request to confirm it or to report your return transfer."
      />

      {state === 'loading' ? (
        <div role="status" className={panel}>
          Loading refund requests…
        </div>
      ) : null}
      {state === 'forbidden' ? (
        <FeedbackAlert tone="error" title="Access denied">
          You do not have permission to access this function.
        </FeedbackAlert>
      ) : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load refund requests">
          <p>Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setState('loading');
              setReloadToken((value) => value + 1);
            }}
            className="mt-2 rounded-lg border border-current px-3 py-1 font-bold"
          >
            Retry
          </button>
        </FeedbackAlert>
      ) : null}
      {state === 'ready' && items.length === 0 ? <FeedbackAlert>No refund requests to show.</FeedbackAlert> : null}
      {state === 'ready' && items.length > 0 ? (
        <>
          <div className="max-w-full overflow-x-auto rounded-2xl border border-[#DCE2DD] bg-white shadow-xs" tabIndex={0}>
            <table className="min-w-[760px] w-full text-left text-sm">
              <caption className="sr-only">Refund requests</caption>
              <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
                <tr>
                  {['Booking', 'Requested', 'Refund Amount', 'Your Share', 'Return Deadline', 'Status'].map((heading) => (
                    <th key={heading} scope="col" className={`px-4 py-3${heading === 'Refund Amount' || heading === 'Your Share' ? ' text-right' : ''}`}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.refundId} className="border-t border-[#ECEEEB] transition hover:bg-[#F7F5EF]/50">
                    <td className="px-4 py-3 font-mono font-bold">
                      <Link href={ROUTES.partner.refundDetail(item.refundId)} className="text-[#174B4A] underline hover:text-[#103B39]">
                        {item.bookingCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(item.requestedAtUtc)}</td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap font-bold">{formatVnd(item.amount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {item.operatorReturnShare === null ? 'Set on confirmation' : formatVnd(item.operatorReturnShare)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.returnDeadlineAtUtc ? formatVietnamDateTime(item.returnDeadlineAtUtc) : 'Not applicable'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${refundStatusBadgeClass(item.status)}`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="mt-4 flex flex-col gap-3 text-sm text-[#5B6E69] sm:flex-row sm:items-center sm:justify-between">
            <p>
              {data!.totalCount} request{data!.totalCount === 1 ? '' : 's'} · Page {data!.pageNumber} of {totalPages}
            </p>
            <div className="flex gap-2">
              <PageButton disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)}>
                Previous
              </PageButton>
              <PageButton disabled={pageNumber >= totalPages} onClick={() => setPageNumber((value) => value + 1)}>
                Next
              </PageButton>
            </div>
          </footer>
        </>
      ) : null}
    </section>
  );
}

const panel = 'rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-[#5B6E69]';

function PageButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-xl border border-[#DCE2DD] bg-white px-4 py-2 text-xs font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
