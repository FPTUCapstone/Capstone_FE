'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { MarkAsResolvedDialog } from './MarkAsResolvedDialog';
import { formatRunDate, formatVietnamDateTime, formatVnd, type FailedPayoutBatchDetail } from './payoutSettlements';
import {
  fetchFailedPayoutBatchDetail,
  markPayoutBatchResolved,
  PayoutSettlementsError,
  retryFailedPayoutBatch,
} from './payoutSettlementsService';

type LoadState = 'loading' | 'ready' | 'notFound' | 'forbidden' | 'unavailable';
type OpenDialog = 'retry' | 'markResolved' | null;

/** UC-73 (SRS rev10-6, 3.10.6): detail of a failed payout batch, plus its two mutually-exclusive
 * actions (v2 — Carry Over and Record Manual Transfer were removed with the backend actions,
 * Task 13). Every action re-fetches the detail on success rather than assuming the new status
 * locally — the same `reloadToken` mechanism the "Retry" button on the unavailable state already
 * uses, so a stale in-flight fetch from an earlier reload is aborted by its own effect cleanup
 * and never overwrites a newer reload's result (U03). */
export function FailedPayoutSettlementScreen({ batchId }: { batchId: number }) {
  const { replace } = useRouter();
  const [detail, setDetail] = useState<FailedPayoutBatchDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [reloadToken, setReloadToken] = useState(0);
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchFailedPayoutBatchDetail(batchId, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setDetail(response);
          setState('ready');
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof PayoutSettlementsError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutSettlementDetail(batchId))}`);
          return;
        }
        if (error instanceof PayoutSettlementsError && error.status === 404) {
          setState('notFound');
          return;
        }
        setState(error instanceof PayoutSettlementsError && error.status === 403 ? 'forbidden' : 'unavailable');
      });
    return () => controller.abort();
  }, [batchId, replace, reloadToken]);

  function reload() {
    setOpenDialog(null);
    setReloadToken((value) => value + 1);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-5 text-[#1C2928] md:px-8">
      <PageHeader
        className="mb-6"
        backLink={{ href: ROUTES.admin.payoutSettlements, label: 'Payout Settlements' }}
        eyebrow="Payout Management"
        title="Failed Payout Settlement"
        description="Review the gateway failure history for this batch. The amount is never recalculated here."
      />

      {state === 'loading' ? (
        <div role="status" className={panel}>
          Loading payout settlement details…
        </div>
      ) : null}
      {state === 'notFound' ? (
        <FeedbackAlert tone="error" title="Payout settlement not found">
          This payout settlement could not be found.
        </FeedbackAlert>
      ) : null}
      {state === 'forbidden' ? (
        <FeedbackAlert tone="error" title="Access denied">
          You do not have permission to access this function.
        </FeedbackAlert>
      ) : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load this payout settlement">
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
      {state === 'ready' && detail ? (
        <>
          <section className="mb-6 grid gap-4 rounded-2xl border border-[#DCE2DD] bg-white p-6 shadow-xs sm:grid-cols-3">
            <SummaryField label="Batch ID" value={String(detail.batchId)} />
            <SummaryField label="Tour Operator" value={String(detail.tourOperatorUserId)} />
            <SummaryField label="Run Date" value={formatRunDate(detail.runDate)} />
            <SummaryField label="Total Amount" value={formatVnd(detail.totalAmount)} />
            <SummaryField label="Status" value={<Badge>{detail.status}</Badge>} />
            <SummaryField label="Attempt Count" value={String(detail.attemptCount)} />
          </section>

          {detail.status === 'SettlementFailed' ? (
            <div className="mb-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setOpenDialog('retry')} className={actionButton}>
                Retry Transfer
              </button>
              <button type="button" onClick={() => setOpenDialog('markResolved')} className={actionButton}>
                Mark as Resolved
              </button>
            </div>
          ) : null}

          <div className="max-w-full overflow-x-auto rounded-2xl border border-[#DCE2DD] bg-white shadow-xs" tabIndex={0}>
            <table className="min-w-[700px] w-full text-left text-sm">
              <caption className="sr-only">Attempt history</caption>
              <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
                <tr>
                  {['Attempt Number', 'Sent At', 'Outcome', 'Failure Reason'].map((heading) => (
                    <th key={heading} scope="col" className="px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.attempts.map((attempt) => (
                  <tr key={attempt.attemptNumber} className="border-t border-[#ECEEEB]">
                    <td className="px-4 py-3 font-semibold text-[#1C2928]">{attempt.attemptNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatVietnamDateTime(attempt.sentAtUtc)}</td>
                    <td className="px-4 py-3">{attempt.outcome}</td>
                    <td className="px-4 py-3">{attempt.failureReason ?? 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <ConfirmActionDialog
        isOpen={openDialog === 'retry'}
        title="Retry Transfer"
        body="The system resends the transfer now. The result — settled, or failed again — is reflected immediately."
        confirmLabel="Retry Transfer"
        onConfirm={() => retryFailedPayoutBatch(batchId)}
        onClose={() => setOpenDialog(null)}
        onSuccess={reload}
      />
      <MarkAsResolvedDialog
        isOpen={openDialog === 'markResolved'}
        onConfirm={(reason) => markPayoutBatchResolved(batchId, reason)}
        onClose={() => setOpenDialog(null)}
        onSuccess={reload}
      />
    </main>
  );
}

const panel = 'rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-[#5B6E69]';
const actionButton = 'rounded-xl border border-[#174B4A] bg-white px-4 py-2 text-xs font-bold text-[#174B4A] transition hover:bg-[#E8F0EA]';

function SummaryField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#5B6E69]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#1C2928]">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#fdecef] px-2.5 py-1 text-xs font-bold text-[#8c1030]">{children}</span>;
}
