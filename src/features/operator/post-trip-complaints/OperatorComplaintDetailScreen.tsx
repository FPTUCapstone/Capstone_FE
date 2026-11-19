'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
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

  if (loading) return <main className="mx-auto max-w-5xl p-8" role="status">Loading complaint…</main>;
  if (!complaint) return <main className="mx-auto max-w-5xl p-8"><FeedbackAlert tone="error" title="Unable to load complaint"><p>{error ?? 'The complaint was not found.'}</p></FeedbackAlert></main>;
  const canRespond = complaint.availableActions.length > 0;
  return <main className="mx-auto w-full max-w-5xl px-4 py-8"><Link href={ROUTES.partner.postTripComplaints} className="text-sm font-semibold text-[#006b5f]">← Back to complaints</Link><h1 className="mt-5 text-3xl font-extrabold">{complaint.bookingCode}</h1>{error ? <div className="mt-4"><FeedbackAlert tone="error">{error}</FeedbackAlert></div> : null}
    <div className="mt-6 grid gap-5 lg:grid-cols-3"><section className="space-y-5 lg:col-span-2"><article className="rounded-xl border bg-white p-5"><dl className="grid gap-4 sm:grid-cols-2"><div><dt>Status</dt><dd className="font-bold">{complaint.status}</dd></div><div><dt>Refundable amount</dt><dd className="font-bold">{formatVnd(complaint.refundableAmount)}</dd></div></dl><p className="mt-5 whitespace-pre-wrap">{complaint.reasonDetail}</p>{complaint.status === 'AwaitingOperatorReconsideration' ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="font-bold">Traveler counter-offer: {complaint.counterOfferAmount === null ? '—' : formatVnd(complaint.counterOfferAmount)}</p><p className="mt-1 whitespace-pre-wrap">{complaint.counterOfferReason}</p><p className="mt-2 text-sm">Respond by {formatDateTime(complaint.operatorReconsiderationDeadlineUtc)}. This is the one final revised offer.</p></div> : null}</article><article className="rounded-xl border bg-white p-5"><h2 className="font-bold">Evidence</h2>{complaint.evidence.map((item) => <div key={item.evidenceId} className="mt-3 flex justify-between"><span>{item.fileName}</span>{item.temporaryDownloadUrl ? <a className="text-[#006b5f]" href={item.temporaryDownloadUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.fileName} in a new tab`}>Open</a> : <span>Unavailable</span>}</div>)}</article></section>
      <aside className="h-fit rounded-xl border bg-white p-5"><h2 className="font-bold">Respond to complaint</h2>{canRespond ? <><select className="mt-4 w-full rounded border p-2" value={action} onChange={(event) => setAction(event.target.value as OperatorComplaintAction)}>{complaint.availableActions.includes('AcceptFullRefund') ? <option value="AcceptFullRefund">Accept full refund</option> : null}{complaint.availableActions.includes('ProposePartialRefund') ? <option value="ProposePartialRefund">Propose partial refund</option> : null}{complaint.availableActions.includes('Reject') ? <option value="Reject">Reject complaint</option> : null}</select>{action === 'ProposePartialRefund' ? <><label className="mt-4 block" htmlFor="partial-amount">Amount</label><input id="partial-amount" className="w-full rounded border p-2" value={amount} onChange={(event) => setAmount(event.target.value)} /><label className="mt-4 block" htmlFor="partial-reason">Reason for this offer</label><textarea id="partial-reason" className="w-full rounded border p-2" value={proposalReason} onChange={(event) => setProposalReason(event.target.value)} maxLength={1000} /></> : null}{action === 'Reject' ? <><label className="mt-4 block" htmlFor="rejection-reason">Reason</label><textarea id="rejection-reason" className="w-full rounded border p-2" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} /></> : null}<button type="button" disabled={saving} onClick={submit} className="mt-5 w-full rounded bg-[#006b5f] px-4 py-2 font-bold text-white">{saving ? 'Submitting…' : 'Submit response'}</button></> : <>{complaint.refundId ? <Link href={ROUTES.partner.refundDetail(complaint.refundId)} className="mt-4 inline-flex rounded-lg bg-[#006b5f] px-4 py-2 font-bold text-white">Continue to refund confirmation</Link> : <p className="mt-4">This complaint has already been handled.</p>}</>}</aside></div>
  </main>;
}
