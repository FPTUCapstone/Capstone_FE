'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { formatVnd, validateReturnReference, type RefundListItem, type RefundListResponse } from '../types/refundLifecycle';
import { fetchEscalatedRefunds, resolveEscalatedRefund, rejectEscalatedRefund, RefundsAdminError } from './refundsAdminService';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'unavailable';

/** UC-67 screen 101 (SRS 3.10.2, BR-161) + the UC-41/UC-42 `Reconciliation` cases (Q-FE3): lists
 * refunds needing manual Administrator resolution, with `Escalated` and `Reconciliation` rows
 * kept visually distinct — only `Escalated` rows carry Attempt Count / Last Error, since those
 * fields describe exhausted gateway retries and never apply to a `Reconciliation` row (an
 * amount-mismatch or unverifiable-transaction case that never reached the gateway). */
export function EscalatedRefundsMonitorScreen() {
  const { replace } = useRouter();
  const [data, setData] = useState<RefundListResponse | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [reloadToken, setReloadToken] = useState(0);
  const [openRowId, setOpenRowId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchEscalatedRefunds(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setData(response);
          setState('ready');
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
        if (error instanceof RefundsAdminError && error.status === 401) {
          replace(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.escalatedRefunds)}`);
          return;
        }
        setState(error instanceof RefundsAdminError && error.status === 403 ? 'forbidden' : 'unavailable');
      });
    return () => controller.abort();
  }, [replace, reloadToken]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 text-[#1C2928] md:px-8">
      <PageHeader
        className="mb-6"
        eyebrow="Refund (Web Administration)"
        title="Escalated Refunds Monitor"
        description="Refunds whose automatic gateway retries are exhausted, or whose amount could not be verified, for manual resolution."
      />

      {state === 'loading' ? <div role="status" className={panel}>Loading escalated refunds…</div> : null}
      {state === 'forbidden' ? (
        <FeedbackAlert tone="error" title="Access denied">
          You do not have permission to access this function.
        </FeedbackAlert>
      ) : null}
      {state === 'unavailable' ? (
        <FeedbackAlert tone="error" title="Unable to load escalated refunds">
          <p>Please check your connection and try again.</p>
          <button type="button" onClick={() => setReloadToken((value) => value + 1)} className="mt-2 rounded-lg border border-current px-3 py-1 font-bold">
            Retry
          </button>
        </FeedbackAlert>
      ) : null}
      {state === 'ready' && data?.items.length === 0 ? <FeedbackAlert>No refunds currently need manual resolution.</FeedbackAlert> : null}
      {state === 'ready' && data && data.items.length > 0 ? (
        <div className="max-w-full overflow-x-auto rounded-2xl border border-[#DCE2DD] bg-white shadow-xs" tabIndex={0}>
          <table className="min-w-[900px] w-full text-left text-sm">
            <caption className="sr-only">Escalated and reconciliation refunds</caption>
            <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
              <tr>
                {['Refund Code', 'Booking Code', 'Amount', 'Status', 'Attempt Count', 'Last Error', 'Actions'].map((heading) => (
                  <th key={heading} scope="col" className={`px-4 py-3${heading === 'Amount' ? ' text-right' : ''}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <RefundRow
                  key={item.refundId}
                  item={item}
                  isOpen={openRowId === item.refundId}
                  onToggle={() => setOpenRowId((current) => (current === item.refundId ? null : item.refundId))}
                  onResolved={() => {
                    setOpenRowId(null);
                    setReloadToken((value) => value + 1);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}

function RefundRow({
  item,
  isOpen,
  onToggle,
  onResolved,
}: {
  item: RefundListItem;
  isOpen: boolean;
  onToggle: () => void;
  onResolved: () => void;
}) {
  const isEscalated = item.status === 'Escalated';
  return (
    <>
      <tr className="border-t border-[#ECEEEB] transition hover:bg-[#F7F5EF]/50">
        <td className="px-4 py-3 font-mono font-bold text-[#1C2928]">{item.refundId}</td>
        <td className="px-4 py-3">{item.bookingCode}</td>
        <td className="px-4 py-3 text-right whitespace-nowrap font-bold">{formatVnd(item.amount)}</td>
        <td className="px-4 py-3">
          <Badge tone={isEscalated ? 'rose' : 'amber'}>{item.status}</Badge>
        </td>
        <td className="px-4 py-3">{isEscalated ? item.attemptCount ?? 0 : 'Not applicable'}</td>
        <td className="px-4 py-3">{isEscalated ? item.lastErrorCode ?? 'Not available' : 'Not applicable'}</td>
        <td className="px-4 py-3">
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={onToggle}
            className="inline-flex whitespace-nowrap rounded-lg border border-[#174B4A] px-3 py-1.5 text-xs font-bold text-[#174B4A] transition hover:bg-[#E8F0EA]"
          >
            View Details
          </button>
        </td>
      </tr>
      {isOpen ? (
        <tr className="border-t border-[#ECEEEB] bg-[#F7F5EF]/60">
          <td colSpan={7} className="px-4 py-4">
            <ResolveRefundForm refundId={item.refundId} onResolved={onResolved} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** The `resolve` endpoint flow: Administrator settles with a gateway reference or rejects with a reason. */
function ResolveRefundForm({ refundId, onResolved }: { refundId: number; onResolved: () => void }) {
  const [action, setAction] = useState<'complete' | 'reject'>('complete');
  const [gatewayReference, setGatewayReference] = useState('');
  const [reason, setReason] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (action === 'complete') {
      const validated = validateReturnReference(gatewayReference);
      if (!validated.ok) {
        setInvalid(true);
        return;
      }
      setInvalid(false);
      setSubmitting(true);
      setError(null);
      try {
        await resolveEscalatedRefund(refundId, validated.value);
        onResolved();
      } catch (err) {
        setError(err instanceof RefundsAdminError ? err.message : 'The request could not be completed.');
      } finally {
        setSubmitting(false);
      }
    } else {
      const trimmed = reason.trim();
      if (!trimmed || trimmed.length > 500) {
        setInvalid(true);
        return;
      }
      setInvalid(false);
      setSubmitting(true);
      setError(null);
      try {
        await rejectEscalatedRefund(refundId, trimmed);
        onResolved();
      } catch (err) {
        setError(err instanceof RefundsAdminError ? err.message : 'The request could not be completed.');
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAction('complete');
            setInvalid(false);
            setError(null);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            action === 'complete'
              ? 'bg-[#103B39] text-white'
              : 'border border-[#DCE2DD] bg-white text-[#5B6E69] hover:bg-[#F7F5EF]'
          }`}
        >
          Complete Refund
        </button>
        <button
          type="button"
          onClick={() => {
            setAction('reject');
            setInvalid(false);
            setError(null);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            action === 'reject'
              ? 'bg-[#8c1030] text-white'
              : 'border border-[#DCE2DD] bg-white text-[#5B6E69] hover:bg-[#F7F5EF]'
          }`}
        >
          Reject Refund
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-wrap items-end gap-3">
        {action === 'complete' ? (
          <label className="text-xs font-bold uppercase tracking-wide text-[#5B6E69]">
            Gateway Reference
            <input
              type="text"
              value={gatewayReference}
              aria-invalid={invalid}
              onChange={(event) => {
                setGatewayReference(event.target.value);
                if (invalid) setInvalid(false);
              }}
              className="mt-1 block w-64 rounded-xl border border-[#DCE2DD] bg-white px-3 py-2 text-sm text-[#1C2928] outline-none focus-visible:border-[#174B4A] focus-visible:ring-2 focus-visible:ring-[#174B4A]/20"
            />
          </label>
        ) : (
          <label className="text-xs font-bold uppercase tracking-wide text-[#5B6E69]">
            Rejection Reason
            <input
              type="text"
              value={reason}
              aria-invalid={invalid}
              placeholder="Reason for rejecting refund..."
              onChange={(event) => {
                setReason(event.target.value);
                if (invalid) setInvalid(false);
              }}
              className="mt-1 block w-80 rounded-xl border border-[#DCE2DD] bg-white px-3 py-2 text-sm text-[#1C2928] outline-none focus-visible:border-[#8c1030] focus-visible:ring-2 focus-visible:ring-[#8c1030]/20"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
            action === 'complete' ? 'bg-[#103B39] hover:bg-[#174B4A]' : 'bg-[#8c1030] hover:bg-[#6c0b24]'
          }`}
        >
          {submitting
            ? action === 'complete'
              ? 'Resolving…'
              : 'Rejecting…'
            : action === 'complete'
              ? 'Resolve'
              : 'Reject Refund'}
        </button>

        {invalid ? (
          <p role="alert" className="text-xs font-semibold text-[#8c1030]">
            {action === 'complete'
              ? 'A gateway reference is required.'
              : 'A reason is required to reject a refund.'}
          </p>
        ) : null}
        {error ? <p role="alert" className="text-xs font-semibold text-[#8c1030]">{error}</p> : null}
      </form>
    </div>
  );
}

const panel = 'rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-[#5B6E69]';

function Badge({ children, tone }: { children: React.ReactNode; tone: 'rose' | 'amber' }) {
  const toneClass = tone === 'rose' ? 'bg-[#fdecef] text-[#8c1030]' : 'bg-[#fef3e2] text-[#7c4a03]';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${toneClass}`}>{children}</span>;
}
