'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { ManualSettlementDialog } from './ManualSettlementDialog';
import { formatRunDate, formatVietnamDateTime, formatVnd, type FailedPayoutBatchDetail } from './payoutSettlements';
import {
  carryOverFailedPayoutBatch,
  fetchFailedPayoutBatchDetail,
  PayoutSettlementsError,
  recordManualPayoutSettlement,
  retryFailedPayoutBatch,
} from './payoutSettlementsService';

type LoadState = 'loading' | 'ready' | 'notFound' | 'forbidden' | 'unavailable';
type OpenDialog = 'retry' | 'carryOver' | 'manualSettlement' | null;

/** UC-73 (SRS §3.9.9.2): detail of a failed payout batch, plus its three mutually-exclusive
 * actions (Task 6). Every action re-fetches the detail on success rather than assuming the new
 * status locally — the same `reloadToken` mechanism the "Retry" button on the unavailable state
 * already uses, so a stale in-flight fetch from an earlier reload is aborted by its own effect
 * cleanup and never overwrites a newer reload's result (U03). */
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
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006b5f]">Payout Management</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#00152a]">Failed Payout Settlement</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#486581]">
          Review the gateway failure history for this batch. The amount is never recalculated here.
        </p>
      </header>

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
          <section className="mb-6 grid gap-4 rounded-2xl border border-[#d7e2ef] bg-white p-6 shadow-sm sm:grid-cols-3">
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
              <button type="button" onClick={() => setOpenDialog('carryOver')} className={actionButton}>
                Carry Over
              </button>
              <button type="button" onClick={() => setOpenDialog('manualSettlement')} className={actionButton}>
                Record Manual Transfer
              </button>
            </div>
          ) : null}

          <div className="max-w-full overflow-x-auto rounded-2xl border border-[#d7e2ef] bg-white shadow-sm" tabIndex={0}>
            <table className="min-w-[700px] w-full text-left text-sm">
              <caption className="sr-only">Attempt history</caption>
              <thead className="bg-[#00152a] text-xs uppercase tracking-wide text-white">
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
                  <tr key={attempt.attemptNumber} className="border-t border-[#e6edf5]">
                    <td className="px-4 py-3">{attempt.attemptNumber}</td>
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
        body="The batch returns to Processing. The resend itself happens on the backend's own retry schedule, not immediately."
        confirmLabel="Retry Transfer"
        onConfirm={() => retryFailedPayoutBatch(batchId)}
        onClose={() => setOpenDialog(null)}
        onSuccess={reload}
      />
      <ConfirmActionDialog
        isOpen={openDialog === 'carryOver'}
        title="Carry Over"
        body="This amount moves to the Tour Operator's next scheduled run instead of retrying this batch."
        confirmLabel="Carry Over"
        onConfirm={() => carryOverFailedPayoutBatch(batchId)}
        onClose={() => setOpenDialog(null)}
        onSuccess={reload}
      />
      <ManualSettlementDialog
        isOpen={openDialog === 'manualSettlement'}
        onConfirm={(transferReference) => recordManualPayoutSettlement(batchId, transferReference)}
        onClose={() => setOpenDialog(null)}
        onSuccess={reload}
      />
    </main>
  );
}

const panel = 'rounded-2xl border border-[#d7e2ef] bg-white p-8 text-center text-[#486581]';
const actionButton = 'rounded-xl border border-[#006b5f] px-4 py-2 text-sm font-bold text-[#006b5f] hover:bg-[#e6f7f0]';

function SummaryField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#627d98]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#00152a]">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#fdecef] px-2.5 py-1 text-xs font-bold text-[#8c1030]">{children}</span>;
}
