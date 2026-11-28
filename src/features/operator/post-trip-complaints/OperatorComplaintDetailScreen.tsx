'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { PartyStaffReviewPanel } from '@/features/complaints/staff-review/PartyStaffReviewPanel';
import { formatDateTime, formatVnd, type OperatorComplaintAction, type OperatorComplaintDetail } from './operatorPostTripComplaints';
import { fetchOperatorComplaint, OperatorComplaintError, respondToOperatorComplaint } from './operatorPostTripComplaintsService';

export function OperatorComplaintDetailScreen({ complaintId }: { complaintId: number }) {
  const [complaint, setComplaint] = useState<OperatorComplaintDetail | null>(null);
  const [action, setAction] = useState<OperatorComplaintAction>('AcceptFullRefund');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [proposalReason, setProposalReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let active = true;
    fetchOperatorComplaint(complaintId).then((value) => {
      if (!active) return;
      setComplaint(value); setAction(value.availableActions[0] ?? 'AcceptFullRefund'); setError(null);
    }).catch((value: unknown) => {
      if (active) setError(value instanceof OperatorComplaintError ? value.message : 'Unable to load complaint.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [complaintId, requestVersion]);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setRequestVersion((value) => value + 1);
  };

  const submit = async () => {
    if (!complaint) return;
    const proposed = action === 'ProposePartialRefund' ? Number(amount) : undefined;
    if (action === 'ProposePartialRefund' && (!Number.isFinite(proposed) || proposed! <= 0 || proposed! > complaint.refundableAmount)) return setError(`Enter an amount from 1 to ${formatVnd(complaint.refundableAmount)}.`);
    if (action === 'ProposePartialRefund' && !proposalReason.trim()) return setError('A reason is required for a partial-refund proposal.');
    if (action === 'Reject' && !reason.trim()) return setError('A reason is required when rejecting a complaint.');
    setSaving(true); setError(null);
    try {
      await respondToOperatorComplaint(complaintId, { action, proposedRefundAmount: proposed,
        proposalReason: action === 'ProposePartialRefund' ? proposalReason.trim() : undefined,
        rejectionReason: action === 'Reject' ? reason.trim() : undefined });
      refresh();
    } catch (value) { setError(value instanceof OperatorComplaintError ? value.message : 'Unable to submit the response.'); }
    finally { setSaving(false); }
  };

  if (loading) return <main className="mx-auto max-w-5xl px-4 py-8 text-sm text-[#5B6E69]" role="status">Loading complaint…</main>;
  if (!complaint) return <main className="mx-auto max-w-5xl px-4 py-8"><FeedbackAlert tone="error" title="Unable to load complaint"><p>{error ?? 'The complaint was not found.'}</p></FeedbackAlert></main>;
  const canRespond = complaint.availableActions.length > 0;
  const fieldClass = 'mt-1.5 w-full rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/60 px-3 py-2 text-sm text-[#1C2928] outline-none transition focus:border-[#174B4A] focus:bg-white focus:ring-2 focus:ring-[#174B4A]/20';
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-5 text-[#1C2928] sm:px-6 sm:py-6">
      <PageHeader
        className="mb-6"
        backLink={{ href: ROUTES.partner.postTripComplaints, label: 'Back to complaints' }}
        eyebrow="Post-trip complaint"
        title={complaint.bookingCode}
        badge={
          <span className="inline-flex rounded-full border border-[#F2D8B3] bg-[#FBF3E8] px-2.5 py-0.5 text-xs font-bold text-[#8F5419]">
            {complaint.status}
          </span>
        }
      />

      {error ? <div className="mb-5"><FeedbackAlert tone="error">{error}</FeedbackAlert></div> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <article className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5B6E69]">Complaint summary</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3">
                <dt className="text-xs font-semibold text-[#5B6E69]">Status</dt>
                <dd className="mt-1 text-sm font-bold text-[#1C2928]">{complaint.status}</dd>
              </div>
              <div className="rounded-xl border border-[#ECEEEB] bg-[#F7F5EF]/60 px-4 py-3">
                <dt className="text-xs font-semibold text-[#5B6E69]">Refundable amount</dt>
                <dd className="mt-1 text-sm font-bold text-[#103B39]">{formatVnd(complaint.refundableAmount)}</dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-[#ECEEEB] pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]">Traveler statement</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#1C2928]">{complaint.reasonDetail}</p>
            </div>
            {complaint.status === 'AwaitingOperatorReconsideration' ? (
              <div className="mt-4 rounded-xl border border-[#F2D8B3] bg-[#FBF3E8] p-4">
                <p className="text-sm font-bold text-[#8F5419]">
                  Traveler counter-offer: {complaint.counterOfferAmount === null ? '—' : formatVnd(complaint.counterOfferAmount)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[#1C2928]">{complaint.counterOfferReason}</p>
                <p className="mt-2 text-xs font-medium text-[#8F5419]">
                  Respond by {formatDateTime(complaint.operatorReconsiderationDeadlineUtc)}. This is the one final revised offer.
                </p>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs sm:p-6">
            <h2 className="text-sm font-extrabold text-[#1C2928]">Evidence</h2>
            {complaint.evidence.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-[#DCE2DD] bg-[#F7F5EF]/60 p-4 text-center text-xs text-[#5B6E69]">
                No evidence files attached.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[#ECEEEB]">
                {complaint.evidence.map((item) => (
                  <li key={item.evidenceId} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                    <span className="min-w-0 truncate font-medium text-[#1C2928]">{item.fileName}</span>
                    {item.temporaryDownloadUrl ? (
                      <a
                        className="shrink-0 rounded-lg border border-[#CBE0D4] bg-[#E8F0EA] px-3 py-1 text-xs font-bold text-[#103B39] transition hover:bg-[#103B39] hover:text-white"
                        href={item.temporaryDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${item.fileName} in a new tab`}
                      >
                        Open
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-[#5B6E69]">Unavailable</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <aside className="h-fit rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-xs sm:p-6">
          <h2 className="text-sm font-extrabold text-[#1C2928]">Respond to complaint</h2>
          {canRespond ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6E69]" htmlFor="complaint-action">
                  Decision
                </label>
                <select
                  id="complaint-action"
                  className={fieldClass}
                  value={action}
                  onChange={(event) => setAction(event.target.value as OperatorComplaintAction)}
                >
                  {complaint.availableActions.includes('AcceptFullRefund') ? <option value="AcceptFullRefund">Accept full refund</option> : null}
                  {complaint.availableActions.includes('ProposePartialRefund') ? <option value="ProposePartialRefund">Propose partial refund</option> : null}
                  {complaint.availableActions.includes('Reject') ? <option value="Reject">Reject complaint</option> : null}
                </select>
              </div>
              {action === 'ProposePartialRefund' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1C2928]" htmlFor="partial-amount">Amount</label>
                    <input id="partial-amount" className={fieldClass} value={amount} onChange={(event) => setAmount(event.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1C2928]" htmlFor="partial-reason">Reason for this offer</label>
                    <textarea id="partial-reason" rows={4} className={fieldClass} value={proposalReason} onChange={(event) => setProposalReason(event.target.value)} maxLength={1000} />
                  </div>
                </>
              ) : null}
              {action === 'Reject' ? (
                <div>
                  <label className="block text-xs font-bold text-[#1C2928]" htmlFor="rejection-reason">Reason</label>
                  <textarea id="rejection-reason" rows={4} className={fieldClass} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} />
                </div>
              ) : null}
              <button
                type="button"
                disabled={saving}
                onClick={submit}
                className="w-full rounded-xl bg-[#103B39] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#174B4A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Submitting…' : 'Submit response'}
              </button>
            </div>
          ) : (
            <div className="mt-4">
              {complaint.refundId ? (
                <Link
                  href={ROUTES.partner.refundDetail(complaint.refundId)}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#103B39] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#174B4A]"
                >
                  Continue to refund confirmation
                </Link>
              ) : (
                <p className="rounded-xl bg-[#F7F5EF] p-3.5 text-xs text-[#5B6E69]">This complaint has already been handled.</p>
              )}
            </div>
          )}
        </aside>
      </div>
      <PartyStaffReviewPanel key={complaintId} complaintId={complaintId} party="Operator" />
    </main>
  );
}
