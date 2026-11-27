'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { LegalModal } from '@/components/ui/LegalModal';
import { CHANNEL_LABELS, CHANNEL_STATUSES, channelDate, type AdminPaymentChannel, type ChannelPage } from '@/features/operator/payment-settings/paymentChannel';
import { decideChannel, listChannels } from '@/features/operator/payment-settings/paymentChannelService';

export function AdminPaymentChannelsScreen() {
  const [status, setStatus] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState<ChannelPage | null>(null);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [revision, setRevision] = useState(0);
  const [selection, setSelection] = useState<{ channel: AdminPaymentChannel; action: 'approve' | 'disable'; operationId: string } | null>(null);
  const [reason, setReason] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    listChannels(status, page, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch((cause: unknown) => { if (!controller.signal.aborted) { setData(null); setError(cause instanceof Error ? cause.message : 'Chưa thể tải danh sách.'); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [status, page, revision]);
  const reload = () => { setLoading(true); setRevision((value) => value + 1); };
  async function decide(event: FormEvent) {
    event.preventDefault(); if (!selection || !reason.trim() || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await decideChannel(selection.channel.channelId, selection.action, { operationId: selection.operationId, expectedVersion: selection.channel.channelVersion, reason: reason.trim() });
      setNotice(selection.action === 'approve' ? 'Đã duyệt kênh thanh toán.' : 'Đã vô hiệu hóa kênh thanh toán.');
      setSelection(null); setReason(''); reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa thể lưu quyết định.');
      // Invalidate a potentially stale decision; never resubmit automatically with a newer version.
      setSelection(null); setReason(''); reload();
    } finally { setBusy(false); }
  }
  function open(channel: AdminPaymentChannel, action: 'approve' | 'disable') {
    setReason(''); setNotice(''); setError(''); setSelection({ channel, action, operationId: crypto.randomUUID() });
  }
  return <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-8" lang="vi">
    <header><h1 className="text-2xl font-bold">Kênh thanh toán đối tác</h1><p className="mt-2 text-sm text-brand-textSecondary">Đối chiếu chủ kênh và tài khoản nhận trước khi duyệt. Kết nối API thành công không tự chứng minh quyền sở hữu tài khoản.</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-brand-lightTeal p-4 text-sm">{notice}</p>}
    <div className="flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Lọc trạng thái<select aria-label="Lọc trạng thái" value={status} disabled={busy} onChange={(event) => { setStatus(event.target.value); setPage(1); setError(''); setLoading(true); }} className="mt-2 block min-h-11 rounded-xl border border-brand-border bg-white px-3"><option value="">Tất cả</option>{CHANNEL_STATUSES.map((item) => <option key={item} value={item}>{CHANNEL_LABELS[item]}</option>)}</select></label><ActionButton variant="outline" disabled={loading || busy} onClick={() => { setError(''); reload(); }}>Tải lại</ActionButton></div>
    {loading ? <p role="status">Đang tải danh sách kênh…</p> : !data ? <ActionButton onClick={() => { setError(''); reload(); }}>Thử lại</ActionButton> : !data.items.length ? <div className="space-y-3 rounded-2xl border border-brand-border bg-white p-8"><p>Không có kênh phù hợp.</p>{page > 1 && <ActionButton variant="outline" onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Trang trước</ActionButton>}</div> : <>
      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white"><table className="w-full text-left text-sm"><caption className="sr-only">Danh sách kênh thanh toán TO</caption><thead className="bg-brand-surface"><tr>{['Đối tác / Kênh', 'Người nhận', 'Trạng thái', 'Kiểm tra / Kết nối', 'Thao tác'].map((title) => <th key={title} scope="col" className="px-4 py-3 font-semibold">{title}</th>)}</tr></thead><tbody>{data.items.map((channel) => <tr key={channel.channelId} className="border-t border-brand-border align-top">
        <td className="px-4 py-4"><p className="font-semibold">{channel.operatorName || `TO #${channel.tourOperatorUserId}`}</p><p className="mt-1 text-xs text-brand-textSecondary">Kênh #{channel.channelId} · Phiên bản {channel.channelVersion}</p></td>
        <td className="px-4 py-4"><p className="break-words font-semibold">{channel.beneficiaryAccountName || 'Chưa cung cấp'}</p><p className="mt-1">{channel.beneficiaryAccountNumberMasked || 'Chưa cung cấp'}</p><p className="mt-1 text-xs">Ngân hàng: {channel.beneficiaryBankCode || 'Chưa cung cấp'}</p></td>
        <td className="px-4 py-4">{CHANNEL_LABELS[channel.status] ?? 'Chưa xác định'}</td>
        <td className="px-4 py-4 text-xs"><p>Kiểm tra: {channelDate(channel.lastVerifiedAt)}</p><p className="mt-2">Webhook: {channelDate(channel.webhookRegisteredAt)}</p></td>
        <td className="px-4 py-4"><div className="flex flex-wrap gap-2">{channel.status === 'PendingVerification' && <ActionButton disabled={busy} onClick={() => open(channel, 'approve')}>Duyệt kênh</ActionButton>}{channel.status !== 'Disabled' && <ActionButton variant="outline" disabled={busy} onClick={() => open(channel, 'disable')}>Vô hiệu hóa</ActionButton>}</div></td>
      </tr>)}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>Trang {data.page} / {Math.max(1, Math.ceil(data.totalCount / data.pageSize))} · {data.totalCount} kênh</span><div className="flex gap-2"><ActionButton variant="outline" disabled={page <= 1 || busy} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Trang trước</ActionButton><ActionButton variant="outline" disabled={page * data.pageSize >= data.totalCount || busy} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Trang sau</ActionButton></div></div>
    </>}
    {selection && <LegalModal showDismissAction={false} title={selection.action === 'approve' ? 'Duyệt kênh thanh toán' : 'Vô hiệu hóa kênh'} onClose={() => { if (!busy) setSelection(null); }}><form onSubmit={decide} className="space-y-4"><p className="text-sm">Kênh #{selection.channel.channelId} · {selection.channel.beneficiaryAccountName}. {selection.action === 'approve' ? 'Chỉ xác nhận sau khi đã đối chiếu hồ sơ chủ kênh và tài khoản nhận.' : 'Kênh không còn được dùng cho thanh toán mới sau khi vô hiệu hóa.'}</p><label className="block text-sm font-semibold">Lý do quyết định<textarea required value={reason} onChange={(event) => setReason(event.target.value)} disabled={busy} className="mt-2 block min-h-28 w-full rounded-xl border border-brand-border p-3" /></label><div className="flex flex-wrap justify-end gap-2"><ActionButton variant="outline" disabled={busy} type="button" onClick={() => setSelection(null)}>Hủy</ActionButton><ActionButton type="submit" loading={busy} disabled={!reason.trim()}>{selection.action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận vô hiệu hóa'}</ActionButton></div></form></LegalModal>}
  </div>;
}
