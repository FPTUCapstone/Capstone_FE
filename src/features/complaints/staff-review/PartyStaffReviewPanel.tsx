'use client';

import { useEffect, useId, useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';

type ReviewEvent = { id: number; action: string; reason: string; contractBasis?: string | null; amount?: number | null; targetParty?: string | null; createdAtUtc: string; dueAtUtc?: string | null };
type Review = { status: string; isClosed?: boolean; allowedActions: string[]; reviewHistory: ReviewEvent[]; evidence?: { id: number; fileName: string }[] };
type Party = 'Traveler' | 'Operator';
const eventLabels: Record<string, string> = { RequestEvidence: 'Yêu cầu bổ sung bằng chứng', EvidenceSubmitted: 'Đã gửi bằng chứng', EvidenceExpired: 'Hết hạn bổ sung — Staff tiếp tục xem xét', Reject: 'Quyết định từ chối khiếu nại', RefundFull: 'Quyết định hoàn toàn bộ', RefundPartial: 'Quyết định hoàn một phần', ReconsiderationRequested: 'Đã gửi yêu cầu xem xét lại' };
const dateTime = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }); };

export function PartyStaffReviewPanel({ complaintId, party }: { complaintId: number; party: Party }) {
  const formId = useId();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [operationId, setOperationId] = useState<string | null>(null);
  const prefix = party === 'Traveler' ? `/api/v1/traveler/complaints/${complaintId}` : `/api/operator/post-trip-complaints/${complaintId}`;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${prefix}/staff-review`, { cache: 'no-store', signal: controller.signal }).then(async (response) => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Unable to load Staff review.');
      return await response.json() as Review;
    }).then((value) => { if (!controller.signal.aborted) { setReview(value); setError(null); } }).catch(() => {
      if (!controller.signal.aborted) setError('Unable to load Staff review. Please try again.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [prefix, reload]);

  const canSubmitEvidence = !review?.isClosed && (review?.allowedActions.includes('SubmitEvidence') ?? false);
  const canReconsider = !review?.isClosed && (review?.allowedActions.includes('RequestReconsideration') ?? false);
  const request = review?.reviewHistory.filter((event) => event.action === 'RequestEvidence' && event.targetParty === party).at(-1);
  const latestRequest = review?.reviewHistory.filter((event) => event.action === 'RequestEvidence').at(-1);
  const decision = review?.reviewHistory.filter((event) => ['RefundFull', 'RefundPartial', 'Reject'].includes(event.action)).at(-1);
  const refundDecided = decision?.action === 'RefundFull' || decision?.action === 'RefundPartial';

  async function submit() {
    if (!review || review.isClosed || saving || (!canSubmitEvidence && !canReconsider)) return;
    if (!reason.trim() || reason.trim().length > 1000) { setError('Enter an explanation of up to 1,000 characters.'); return; }
    if (files.length < 1 || files.length > 3 || files.some((file) => file.size <= 0 || file.size > 5 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))) {
      setError('Attach 1–3 new PDF, JPG or PNG files, up to 5 MB per file.'); return;
    }
    if (canSubmitEvidence && !request) { setError('Reload the current evidence request before submitting.'); return; }
    const key = operationId ?? crypto.randomUUID();
    setOperationId(key); setSaving(true); setError(null); setNotice(null);
    const form = new FormData();
    form.set('operationId', key); form.set('reason', reason.trim());
    if (canSubmitEvidence) form.set('requestEventId', String(request!.id));
    for (const file of files) form.append('files', file);
    try {
      const response = await fetch(`${prefix}/${canSubmitEvidence ? 'staff-evidence' : 'reconsideration'}`, { method: 'POST', body: form });
      if (!response.ok) throw new Error(response.status === 409 ? 'This request has changed. Reload the review before submitting again.' : 'Unable to submit your evidence. Please try again.');
      setReview(await response.json() as Review); setFiles([]); setReason(''); setOperationId(null);
      setNotice(canSubmitEvidence ? 'Your evidence has been recorded.' : 'Your reconsideration request has been recorded. The current decision and refund remain unchanged.');
    } catch (value) { setError(value instanceof Error ? value.message : 'Unable to submit your evidence.'); }
    finally { setSaving(false); }
  }

  if (loading) return <p role="status" className="mt-5 text-sm text-brand-textSecondary">Loading Staff review…</p>;
  if (!review && !error) return null;
  return <section className="mt-5 space-y-4 rounded-2xl border border-brand-border bg-white p-5" aria-label="Staff complaint review">
    <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-brand-textPrimary">Kết quả xử lý khiếu nại</h2><ActionButton type="button" variant="outline" disabled={saving} onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Tải lại</ActionButton></div>
    {error ? <FeedbackAlert tone="error">{error}</FeedbackAlert> : null}
    {notice ? <FeedbackAlert tone="success">{notice}</FeedbackAlert> : null}
    {review ? <div className={`rounded-xl border p-4 ${review.isClosed ? 'border-emerald-200 bg-emerald-50' : 'border-brand-border bg-brand-lightTeal'}`} role="status">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-bold text-brand-textPrimary">{review.isClosed ? 'Đã hoàn tiền · Khiếu nại đã đóng' : refundDecided ? 'Đã duyệt hoàn tiền' : decision?.action === 'Reject' ? 'Khiếu nại đã được từ chối' : review.status === 'AwaitingStaffEvidence' ? 'Đang chờ bổ sung bằng chứng' : 'Staff đang xem xét khiếu nại'}</p>
          <p className="mt-1 text-sm text-brand-textSecondary">{review.isClosed ? 'Bạn đã hoàn tất quá trình hoàn tiền. Hồ sơ được giữ lại để tra cứu.' : refundDecided ? 'Mức hoàn đã được quyết định. Theo dõi tiến trình chuyển tiền tại Refund Details.' : 'Xem tiến trình xử lý và các yêu cầu liên quan bên dưới.'}</p></div>
        {refundDecided && decision?.amount != null ? <p className="ml-auto text-right text-xl font-extrabold tabular-nums text-brand-teal">{decision.amount.toLocaleString('vi-VN')} ₫<span className="mt-1 block text-xs font-normal text-brand-textSecondary">{review.isClosed ? 'Số tiền đã hoàn' : 'Số tiền được duyệt'}</span></p> : null}
      </div>
    </div> : null}
    {review?.reviewHistory.length ? <details open={!review.isClosed} className="rounded-xl border border-brand-border">
      <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold text-brand-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal">Lịch sử xử lý <span className="font-normal text-brand-textSecondary">({review.reviewHistory.length} bước)</span></summary>
      <ol className="mx-5 mb-4 ml-7 border-l border-brand-border">{review.reviewHistory.map((event, index) => {
        const activeRequest = event.action === 'RequestEvidence' && !review.isClosed && review.status === 'AwaitingStaffEvidence' && latestRequest?.id === event.id;
        return <li key={event.id} className="relative pb-5 pl-6 text-sm last:pb-0">
          <span aria-hidden="true" className="absolute -left-3 flex size-6 items-center justify-center rounded-full border border-brand-border bg-white text-xs font-bold text-brand-teal">{index + 1}</span>
          <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-semibold text-brand-textPrimary">{eventLabels[event.action] ?? event.action}</p><time dateTime={event.createdAtUtc} className="text-xs text-brand-textSecondary">{dateTime(event.createdAtUtc)}</time></div>
          {event.action === 'RequestEvidence' ? <p className={`mt-1 text-xs font-semibold ${activeRequest ? 'text-amber-800' : 'text-brand-textSecondary'}`}>{activeRequest ? 'Đang chờ phản hồi' : 'Yêu cầu đã kết thúc'}</p> : null}
          <p className="mt-2 whitespace-pre-wrap break-words text-brand-textPrimary">{event.reason}</p>
          {event.contractBasis ? <p className="mt-1 whitespace-pre-wrap break-words text-brand-textSecondary"><span className="font-medium">Căn cứ hợp đồng: </span>{event.contractBasis}</p> : null}
          {event.amount != null ? <p className="mt-2 text-right font-bold tabular-nums text-brand-teal">{event.amount.toLocaleString('vi-VN')} ₫</p> : null}
          {activeRequest && event.dueAtUtc ? <div className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-brand-textPrimary"><p className="font-semibold">Hạn bổ sung: {dateTime(event.dueAtUtc)} (giờ Việt Nam)</p><p className="mt-1">Sau 72 giờ, Staff tiếp tục xem xét. Khiếu nại không tự động bị từ chối.</p></div> : null}
        </li>;
      })}</ol>
    </details> : null}
    {review?.evidence?.length ? <details className="rounded-xl border border-brand-border"><summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold text-brand-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal">Bằng chứng đã gửi <span className="font-normal text-brand-textSecondary">({review.evidence.length} tệp)</span></summary><ul className="space-y-1 border-t border-brand-border px-4 py-2">{review.evidence.map((file) => <li key={file.id}><a className="inline-flex min-h-11 items-center break-all text-sm font-semibold text-brand-teal underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal" href={`${prefix}/staff-review/evidence/${file.id}`} target="_blank" rel="noopener noreferrer">{file.fileName}<span className="sr-only"> (mở trong thẻ mới)</span></a></li>)}</ul></details> : null}
    {canSubmitEvidence || canReconsider ? <form className="space-y-3 border-t border-brand-border pt-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <h3 className="font-bold">{canSubmitEvidence ? 'Respond to the evidence request' : 'Request reconsideration'}</h3>
      {canReconsider ? <p className="text-sm text-brand-textSecondary">Attach new evidence. This request does not change the current decision or refund obligation, and does not create another refund.</p> : null}
      <label className="block text-sm font-semibold" htmlFor={`${formId}-reason`}>Explanation</label><textarea id={`${formId}-reason`} required maxLength={1000} disabled={saving} value={reason} onChange={(event) => { setReason(event.target.value); setOperationId(null); }} className="min-h-24 w-full rounded-xl border border-brand-border p-3" />
      <label className="block text-sm font-semibold" htmlFor={`${formId}-files`}>New evidence</label><input id={`${formId}-files`} type="file" multiple accept="application/pdf,image/jpeg,image/png" disabled={saving} onChange={(event) => { setFiles(Array.from(event.target.files ?? [])); setOperationId(null); }} className="block w-full text-sm" />
      <p className="text-xs text-brand-textSecondary">1–3 PDF/JPG/PNG files, maximum 5 MB each.</p>
      <ActionButton type="submit" disabled={saving}>{saving ? 'Submitting…' : canSubmitEvidence ? 'Submit evidence' : 'Request reconsideration'}</ActionButton>
    </form> : null}
  </section>;
}
