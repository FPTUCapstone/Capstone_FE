'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { complaintDate, complaintMoney, inputClass, panelClass, readComplaintResponse } from './presentation';
import { complaintStatusLabel, decisionLabels, type ComplaintDecisionAction, type StaffComplaintDetail } from './types';

function historyLabel(action: string): string {
  return decisionLabels[action as ComplaintDecisionAction] ?? ({ EvidenceSubmitted: 'Đã bổ sung bằng chứng', EvidenceExpired: 'Hết hạn bổ sung — chuyển Staff xem xét', ReconsiderationRequested: 'Yêu cầu xem xét lại — quyết định hiện tại giữ nguyên' } as Record<string, string>)[action] ?? action;
}

export function StaffComplaintDetailScreen({ id }: { id: string }) {
  const [detail, setDetail] = useState<StaffComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<ComplaintDecisionAction>('RequestEvidence');
  const [reason, setReason] = useState('');
  const [contractBasis, setContractBasis] = useState('');
  const [amount, setAmount] = useState('');
  const [targetParty, setTargetParty] = useState('Traveler');
  const [operationId, setOperationId] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch(`/api/staff/post-trip-complaints/${id}`, { cache: 'no-store', signal: abort.signal })
      .then(readComplaintResponse<StaffComplaintDetail>).then(data => {
        setDetail(data); setAction((data.allowedActions.find(a => Object.hasOwn(decisionLabels, a)) ?? 'RequestEvidence') as ComplaintDecisionAction);
        setConflict(false); setOperationId(null); setError('');
      }).catch(e => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [id, reload]);

  const allowed = detail?.allowedActions.filter(a => Object.hasOwn(decisionLabels, a)) as ComplaintDecisionAction[] | undefined;
  const validAmount = action !== 'RefundPartial' || (/^\d+$/.test(amount) && Number.isSafeInteger(Number(amount)) && Number(amount) > 0 && Number(amount) <= (detail?.refundableAmount ?? 0));
  const valid = !!detail && !!allowed?.includes(action) && !!reason.trim() && !!contractBasis.trim() && validAmount && !conflict;
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!valid || !detail || busy) return;
    setBusy(true); setError(''); setSuccess('');
    const op = operationId ?? crypto.randomUUID(); setOperationId(op);
    try {
      const response = await fetch(`/api/staff/post-trip-complaints/${id}/decisions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason: reason.trim(), contractBasis: contractBasis.trim(), expectedVersion: detail.rowVersion, operationId: op,
        ...(action === 'RefundPartial' ? { amount: Number(amount) } : {}), ...(action === 'RequestEvidence' ? { targetParty } : {}) }) });
      if (response.status === 409) setConflict(true);
      const updated = await readComplaintResponse<StaffComplaintDetail>(response);
      setDetail(updated); setSuccess('Đã ghi nhận quyết định. Hồ sơ bên dưới đã được cập nhật.');
      setReason(''); setContractBasis(''); setAmount(''); setOperationId(null);
      setAction((updated.allowedActions.find(a => Object.hasOwn(decisionLabels, a)) ?? 'RequestEvidence') as ComplaintDecisionAction);
    } catch (e) { setError(e instanceof Error ? e.message : 'Chưa thể ghi nhận quyết định.'); } finally { setBusy(false); }
  }
  function changeIntent() { setOperationId(null); setSuccess(''); }

  return <main className="mx-auto max-w-6xl space-y-5 p-4 text-text-primary sm:p-6">
    <Link href={ROUTES.admin.staffPostTripComplaints} className="inline-block rounded-lg py-2 text-sm font-semibold text-primary focus-visible:outline-2">← Danh sách khiếu nại</Link>
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Xem xét khiếu nại #{id}</h1><ActionButton variant="outline" disabled={busy || loading} onClick={() => { setLoading(true); setReload(n => n + 1); }}>Tải lại hồ sơ</ActionButton></div>
    {loading && <p role="status">Đang tải hồ sơ…</p>}
    {error && <FeedbackAlert tone="error">{error}</FeedbackAlert>}
    {success && <FeedbackAlert tone="success">{success}</FeedbackAlert>}
    {detail && <>
      <section className={`${panelClass} flex flex-wrap justify-between gap-5`} aria-label="Thông tin booking">
        <div><p className="text-sm text-text-secondary">{detail.bookingCode}</p><h2 className="mt-1 text-lg font-bold">{detail.tourTitle}</h2><p className="mt-2 text-sm">{complaintStatusLabel(detail.status)}</p><p className="mt-1 text-xs text-text-secondary">Nộp lúc {complaintDate(detail.submittedAtUtc)}</p></div>
        <div className="ml-auto text-right"><p className="text-sm text-text-secondary">Giới hạn hoàn đã xác minh</p><p className="mt-1 text-xl font-bold tabular-nums">{complaintMoney(detail.refundableAmount)}</p></div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panelClass}><h2 className="font-bold">Nội dung khiếu nại</h2><p className="mt-3 text-sm text-text-secondary">{detail.reasonCategory}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{detail.reasonDetail}</p>
          <h3 className="mt-5 font-semibold">Hồ sơ bằng chứng</h3>{detail.evidence.length ? <ul className="mt-2 space-y-2">{detail.evidence.map(file => <li key={file.id} className="rounded-xl border border-border p-3 text-sm"><a className="break-all font-semibold text-primary underline focus-visible:outline-2" href={`/api/staff/post-trip-complaints/${id}/evidence/${file.id}`} target="_blank" rel="noopener noreferrer">{file.fileName} — Xem tệp</a><p className="mt-1 text-xs text-text-secondary">{complaintDate(file.uploadedAtUtc)}</p></li>)}</ul> : <p className="mt-2 text-sm text-text-secondary">Không có tệp đính kèm.</p>}
        </section>
        <section className={panelClass}><h2 className="font-bold">Lịch sử thương lượng</h2>{detail.negotiationHistory.length ? <ol className="mt-3 space-y-3">{detail.negotiationHistory.map(item => <li key={item.id} className="rounded-xl border border-border p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-semibold">Vòng {item.round} · {item.actor}</span>{item.amount !== null && <span className="ml-auto text-right font-semibold tabular-nums">{complaintMoney(item.amount)}</span>}</div><p className="mt-1">{item.eventType}</p>{item.reason && <p className="mt-1 whitespace-pre-wrap break-words">{item.reason}</p>}<p className="mt-2 text-xs text-text-secondary">{complaintDate(item.occurredAtUtc)}</p></li>)}</ol> : <p className="mt-3 text-sm text-text-secondary">Chưa có lịch sử thương lượng.</p>}</section>
      </div>
      <section className={panelClass}><h2 className="font-bold">Lịch sử xử lý của Staff</h2>{detail.reviewHistory.length ? <ol className="mt-3 space-y-3">{detail.reviewHistory.map(item => <li key={item.id} className="rounded-xl border border-border p-3 text-sm"><div className="flex flex-wrap justify-between gap-3"><strong>{historyLabel(item.action)}{item.targetParty ? ` · ${item.targetParty === 'Traveler' ? 'Traveler' : 'TO'}` : ''}</strong>{item.amount !== null && <span className="ml-auto text-right font-bold tabular-nums">{complaintMoney(item.amount)}</span>}</div><p className="mt-2 whitespace-pre-wrap break-words">{item.reason}</p><p className="mt-1 whitespace-pre-wrap break-words text-text-secondary">Căn cứ: {item.contractBasis}</p><p className="mt-2 text-xs text-text-secondary">{complaintDate(item.createdAtUtc)} · {item.actorUserId == null ? 'Hệ thống' : `Tài khoản #${item.actorUserId}`}</p>{item.dueAtUtc && <p className="mt-1 text-xs font-semibold text-primary">Hạn bổ sung: {complaintDate(item.dueAtUtc)} (72 giờ; quá hạn chuyển Staff xem xét)</p>}{item.requestEventId && <p className="mt-1 text-xs text-text-secondary">Theo yêu cầu #{item.requestEventId}</p>}</li>)}</ol> : <p className="mt-3 text-sm text-text-secondary">Chưa có quyết định của Staff.</p>}</section>
      {!!allowed?.length && <section className={panelClass}><h2 className="text-lg font-bold">Quyết định xử lý</h2><p className="mt-2 text-sm text-text-secondary">Chỉ sử dụng căn cứ hợp đồng thực tế. Quyết định hoàn tiền có hiệu lực mà không cần khách xác nhận lại mức hoàn.</p>
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold">Quyết định<select className={inputClass} disabled={busy} value={action} onChange={e => { changeIntent(); setAction(e.target.value as ComplaintDecisionAction); }}>{allowed.map(a => <option key={a} value={a}>{decisionLabels[a]}</option>)}</select></label>
          {action === 'RequestEvidence' && <label className="space-y-2 text-sm font-semibold">Bên cần bổ sung<select className={inputClass} disabled={busy} value={targetParty} onChange={e => { changeIntent(); setTargetParty(e.target.value); }}><option value="Traveler">Traveler</option><option value="Operator">Tour Operator</option></select></label>}
          {action === 'RefundPartial' && <label className="space-y-2 text-sm font-semibold">Số tiền hoàn (VNĐ)<input className={`${inputClass} text-right tabular-nums`} aria-label="Số tiền hoàn (VNĐ)" inputMode="numeric" value={amount} disabled={busy} onChange={e => { changeIntent(); setAmount(e.target.value); }} required aria-invalid={!validAmount} /><span className="block text-xs font-normal text-text-secondary">Số nguyên dương, tối đa {complaintMoney(detail.refundableAmount)}.</span></label>}
          <label className="space-y-2 text-sm font-semibold sm:col-span-2">Lý do<textarea className={inputClass} rows={3} required maxLength={1000} disabled={busy} value={reason} onChange={e => { changeIntent(); setReason(e.target.value); }} /></label>
          <label className="space-y-2 text-sm font-semibold sm:col-span-2">Căn cứ hợp đồng<textarea className={inputClass} rows={3} required maxLength={1000} disabled={busy} value={contractBasis} onChange={e => { changeIntent(); setContractBasis(e.target.value); }} /></label>
          <div className="sm:col-span-2"><ActionButton type="submit" loading={busy} disabled={!valid}>Ghi nhận quyết định</ActionButton></div>
        </form>
      </section>}
    </>}
  </main>;
}



