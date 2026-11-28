'use client';

import Link from 'next/link';
import { CommissionCalculationBreakdown } from './CommissionCalculationBreakdown';
import { useCallback, useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { LegalModal } from '@/components/ui/LegalModal';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { commissionDateTime, commissionDate, commissionMoney, commissionPeriod, commissionStatus, commissionStatusClass, readCommissionResponse, readStatement, safePayOsCheckout, type CommissionStatement } from './commission';

export function CommissionStatementDetailScreen({ statementId }: { statementId: string }) {
  const [statement, setStatement] = useState<CommissionStatement | null>(null);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [confirmMock, setConfirmMock] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/operator/commission-statements/${encodeURIComponent(statementId)}`, { cache: 'no-store', signal });
      const value = readStatement(await readCommissionResponse(response));
      if (!signal?.aborted) { setStatement(value); setError(''); }
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Chưa tải được đối soát.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [statementId]);
  useEffect(() => {
    const abort = new AbortController(); const timer = window.setTimeout(() => void load(abort.signal), 0);
    const refresh = () => { void load(abort.signal); };
    window.addEventListener('focus', refresh);
    return () => { abort.abort(); window.clearTimeout(timer); window.removeEventListener('focus', refresh); };
  }, [load]);

  async function pay(mock = false) {
    if (!statement || busy) return;
    if (mock && (!statement.payment?.canCompleteMock || statement.payment.provider !== 'Mock' || !statement.allowedActions.includes('CompleteMock'))) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/v1/operator/commission-statements/${encodeURIComponent(statementId)}/${mock ? 'mock-complete' : 'payment-link'}`, {
        method: 'POST', ...(mock ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: statement.payment!.paymentId }) } : {}),
      });
      await readCommissionResponse(response);
      setConfirmMock(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Chưa thể tạo thanh toán.'); }
    finally { setBusy(false); }
  }

  const s = statement;
  const noPaymentRequired = s?.commissionAmountVnd === 0;
  const mockReady = !!s?.allowedActions.includes('CompleteMock') && s.payment?.provider === 'Mock' && s.payment.canCompleteMock;
  const checkout = s?.payment?.provider === 'PayOS' && s.payment.status === 'Pending' && safePayOsCheckout(s.payment.checkoutUrl) ? s.payment.checkoutUrl : null;
  return <PartnerWorkspaceLayout activeTab="commissions"><main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
    <Link href="/partner/commission-statements" className="inline-flex min-h-11 items-center font-semibold text-brand-teal">← Danh sách đối soát</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><h1 className="text-2xl font-bold">{s ? `Hoa hồng tháng ${commissionPeriod(s.period)}` : 'Chi tiết đối soát'}</h1><ActionButton variant="outline" disabled={busy || loading} onClick={() => void load()}>Cập nhật trạng thái</ActionButton></div>
    {loading ? <p role="status">Đang tải đối soát…</p> : null}
    {error ? <FeedbackAlert tone="error">{error}</FeedbackAlert> : null}
    {s ? <>
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-brand-border bg-brand-lightTeal p-5"><div><p className="text-sm text-brand-textSecondary">{s.statementCode ?? `Đối soát #${s.id}`}</p><span className={`mt-3 inline-block rounded-lg px-3 py-1 text-sm font-semibold ${commissionStatusClass(s.status)}`}>{noPaymentRequired ? 'Không cần thanh toán kỳ này' : commissionStatus(s.status)}</span><p className="mt-3 text-sm text-brand-textSecondary">{noPaymentRequired ? 'Khoản điều chỉnh đã được ghi nhận trong bảng đối soát.' : s.status === 'Paid' ? `Đã ghi nhận ngày ${commissionDate(s.paidAtUtc)}.` : `Thanh toán cho TripMate trước ${commissionDate(s.dueAtUtc)}.`}</p></div><div className="ml-auto text-right"><p className="text-sm text-brand-textSecondary">{s.status === 'Paid' ? 'Hoa hồng đã thanh toán' : 'Hoa hồng phải trả'}</p><p className="mt-2 text-3xl font-extrabold tabular-nums text-brand-teal">{commissionMoney(s.commissionAmountVnd)}</p></div></section>
      <section className="rounded-2xl border border-brand-border bg-white p-5"><h2 className="font-bold">Cách tính hoa hồng</h2><dl className="mt-3 divide-y divide-brand-border text-sm"><Row label="Doanh thu đủ điều kiện sau hoàn tiền" value={commissionMoney(s.eligibleBaseVnd)} /><Row label="Tỷ lệ đã chốt" value={`${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(s.commissionRateSnapshot * 100)}%`} /><Row label="Hoa hồng kỳ này" value={commissionMoney(s.commissionAmountVnd)} /><Row label="Ngày phát hành" value={commissionDate(s.issuedAtUtc)} /><Row label="Hạn thanh toán" value={noPaymentRequired ? '—' : commissionDate(s.dueAtUtc)} /></dl><p className="mt-4 text-xs text-brand-textSecondary">Số tiền do hệ thống chốt theo bảng đối soát tháng. TO không cần nhập số tiền chuyển khoản.</p></section>
      {s.calculation ? <CommissionCalculationBreakdown calculation={s.calculation} /> : null}
      {s.commissionAmountVnd > 0 && s.allowedActions.includes('Pay') ? <section className="space-y-4 rounded-2xl border border-brand-border bg-white p-5"><h2 className="font-bold">Thanh toán cho TripMate</h2>
        {mockReady ? <><FeedbackAlert tone="warning">Đang dùng Mock để kiểm thử. Thao tác này không chuyển tiền thật.</FeedbackAlert><ActionButton disabled={busy} onClick={() => setConfirmMock(true)}>Thanh toán thử (Mock)</ActionButton></> : checkout ? <><p className="text-sm text-brand-textSecondary">Mở QR/link payOS để thanh toán đúng số tiền. Hệ thống chỉ ghi nhận sau khi nhận xác nhận từ cổng thanh toán.</p><a href={checkout} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-brand-teal px-4 font-semibold text-white">Mở thanh toán payOS</a><p className="text-xs text-brand-textSecondary">Hiệu lực liên kết: {commissionDateTime(s.payment?.expiresAtUtc)}. Sau khi chuyển tiền, bấm Cập nhật trạng thái.</p></> : <><p className="text-sm text-brand-textSecondary">Tạo hoặc sử dụng lại liên kết thanh toán của bảng đối soát này.</p><ActionButton loading={busy} disabled={loading} onClick={() => void pay()}>Thanh toán hoa hồng</ActionButton></>}
      </section> : null}
    </> : null}
    {confirmMock && mockReady ? <LegalModal title="Xác nhận thanh toán thử" onClose={() => { if (!busy) setConfirmMock(false); }} showDismissAction={false}><p className="text-sm">Ghi nhận thanh toán thử {commissionMoney(s!.commissionAmountVnd)} cho bảng đối soát này? Không có tiền thật được chuyển.</p><div className="mt-5 flex justify-end gap-3"><ActionButton variant="outline" disabled={busy} onClick={() => setConfirmMock(false)}>Hủy</ActionButton><ActionButton loading={busy} onClick={() => void pay(true)}>Xác nhận thanh toán thử</ActionButton></div></LegalModal> : null}
  </main></PartnerWorkspaceLayout>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 py-3"><dt className="text-brand-textSecondary">{label}</dt><dd className="text-right font-semibold tabular-nums">{value}</dd></div>; }
