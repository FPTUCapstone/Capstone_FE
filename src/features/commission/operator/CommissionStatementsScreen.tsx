'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { commissionDate, commissionMoney, commissionPeriod, commissionStatus, commissionStatusClass, readCommissionResponse, readStatementPage, type CommissionPage } from './commission';

export function CommissionStatementsScreen() {
  const [data, setData] = useState<CommissionPage | null>(null);
  const [page, setPage] = useState(1); const [status, setStatus] = useState('');
  const [reload, setReload] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    const query = new URLSearchParams({ pageNumber: String(page), pageSize: '20' }); if (status) query.set('status', status);
    void fetch(`/api/v1/operator/commission-statements?${query}`, { cache: 'no-store', signal: abort.signal })
      .then(readCommissionResponse).then(readStatementPage).then(value => { if (!abort.signal.aborted) { setData(value); setError(''); } })
      .catch(e => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [page, status, reload]);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  return <PartnerWorkspaceLayout activeTab="commissions"><main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Hoa hồng &amp; Thanh toán</h1><p className="mt-2 text-sm text-brand-textSecondary">Đối soát tháng và thanh toán hoa hồng cho TripMate.</p></div><ActionButton variant="outline" disabled={loading} onClick={() => { setLoading(true); setReload(n => n + 1); }}>Tải lại</ActionButton></header>
    <div className="rounded-xl border border-brand-border bg-brand-lightTeal p-4 text-sm"><p className="font-semibold">TO giữ doanh thu tour và thanh toán phần hoa hồng đã chốt.</p><p className="mt-1 text-brand-textSecondary">Số tiền phải trả được tính từ doanh thu đủ điều kiện và tỷ lệ trong bảng đối soát; hạn trả là 7 ngày từ ngày phát hành.</p></div>
    <label className="block text-sm font-semibold">Trạng thái<select className="ml-3 rounded-lg border border-brand-border bg-white p-2" value={status} onChange={e => { setLoading(true); setStatus(e.target.value); setPage(1); }}><option value="">Tất cả</option>{['Issued', 'Overdue', 'Paid', 'Cancelled'].map(s => <option key={s} value={s}>{commissionStatus(s)}</option>)}</select></label>
    {loading ? <p role="status">Đang tải đối soát…</p> : error ? <FeedbackAlert tone="error">{error}</FeedbackAlert> : data && <>
      {data.items.length ? <div className="overflow-x-auto rounded-xl border border-brand-border bg-white"><table className="w-full min-w-[700px] text-left text-sm"><caption className="sr-only">Đối soát hoa hồng tháng của TO</caption><thead className="bg-brand-surface text-xs text-brand-textSecondary"><tr><th className="p-4">Kỳ đối soát</th><th className="p-4 text-right">Doanh thu tính phí</th><th className="p-4 text-right">Hoa hồng phải trả</th><th className="p-4">Hạn trả</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{data.items.map(s => <tr key={s.id} className="border-t border-brand-border"><td className="p-4 font-semibold">{commissionPeriod(s.period)}</td><td className="p-4 text-right tabular-nums">{commissionMoney(s.eligibleBaseVnd)}</td><td className="p-4 text-right font-bold tabular-nums">{commissionMoney(s.commissionAmountVnd)}</td><td className="p-4 whitespace-nowrap">{s.commissionAmountVnd === 0 ? '—' : commissionDate(s.dueAtUtc)}</td><td className="p-4"><span className={`inline-block whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold ${commissionStatusClass(s.status)}`}>{s.commissionAmountVnd === 0 ? 'Không cần thanh toán' : commissionStatus(s.status)}</span></td><td className="p-4 text-right"><Link className="inline-flex min-h-11 items-center rounded-lg border border-brand-border px-3 font-semibold text-brand-teal" href={`/partner/commission-statements/${s.id}`}>{s.allowedActions.includes('Pay') ? 'Chi tiết / Thanh toán' : 'Xem chi tiết'}</Link></td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-brand-border bg-white p-8 text-center"><h2 className="font-bold">Chưa có bảng đối soát phù hợp</h2><p className="mt-2 text-sm text-brand-textSecondary">Bảng đối soát sẽ xuất hiện sau khi kỳ tháng được phát hành.</p></div>}
      <div className="flex items-center justify-end gap-3 text-sm"><ActionButton variant="outline" disabled={page <= 1} onClick={() => { setLoading(true); setPage(n => n - 1); }}>Trước</ActionButton><span>Trang {page}/{totalPages}</span><ActionButton variant="outline" disabled={page >= totalPages} onClick={() => { setLoading(true); setPage(n => n + 1); }}>Sau</ActionButton></div>
    </>}
  </main></PartnerWorkspaceLayout>;
}
