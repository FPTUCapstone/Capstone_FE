'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { complaintDate, complaintMoney, inputClass, panelClass, readComplaintResponse } from './presentation';
import { complaintStatusLabel, type StaffComplaintList } from './types';

export function StaffComplaintListScreen() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StaffComplaintList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    const query = new URLSearchParams({ page: String(page), pageSize: '20' }); if (status) query.set('status', status);
    fetch(`/api/staff/post-trip-complaints?${query}`, { cache: 'no-store', signal: abort.signal }).then(readComplaintResponse<StaffComplaintList>)
      .then(result => { setData(result); setError(''); }).catch(e => { if (!abort.signal.aborted) setError(e.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [page, status, reload]);
  return <main className="mx-auto max-w-7xl space-y-5 p-4 text-text-primary sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Staff · Xử lý khiếu nại</p><h1 className="mt-2 text-2xl font-bold">Khiếu nại sau tour</h1><p className="mt-2 text-sm text-text-secondary">Xem xét các hồ sơ chưa thống nhất mức hoàn và lịch sử quyết định.</p></div><ActionButton variant="outline" disabled={loading} onClick={() => { setLoading(true); setReload(n => n + 1); }}>Tải lại</ActionButton></header>
    <section className={`${panelClass} flex flex-wrap items-end justify-between gap-4`}><label className="block min-w-56 space-y-2 text-sm font-semibold">Trạng thái<select className={inputClass} value={status} onChange={e => { setLoading(true); setStatus(e.target.value); setPage(1); }}><option value="">Tất cả hồ sơ</option>{['AwaitingStaffReview', 'AwaitingStaffEvidence', 'Approved', 'Rejected'].map(value => <option key={value} value={value}>{complaintStatusLabel(value)}</option>)}</select></label><p className="text-sm text-text-secondary">{!loading && !error && data ? `${data.totalCount} hồ sơ` : 'Danh sách xử lý'}</p></section>
    {loading ? <p role="status">Đang tải danh sách…</p> : error ? <FeedbackAlert tone="error">{error}</FeedbackAlert> : data && <>
      {!data.items.length ? <section className={`${panelClass} py-12 text-center`}><h2 className="font-bold">Chưa có hồ sơ phù hợp</h2><p className="mt-2 text-sm text-text-secondary">Các khiếu nại cần Staff xử lý sẽ xuất hiện tại đây.</p></section> : <div className="overflow-x-auto rounded-2xl border border-border bg-surface"><table className="w-full min-w-[780px] text-left text-sm"><caption className="sr-only">Danh sách khiếu nại sau tour cần Staff xử lý</caption><thead className="border-b border-border bg-background text-xs uppercase text-text-secondary"><tr><th className="p-4">Booking / Tour</th><th className="p-4">Ngày nộp</th><th className="p-4 text-right">Giới hạn hoàn</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{data.items.map(item => <tr key={item.complaintId} className="border-b border-border last:border-0"><td className="p-4"><p className="font-semibold">{item.bookingCode}</p><p className="mt-1 max-w-xs break-words text-text-secondary">{item.tourTitle}</p><p className="mt-1 text-xs text-text-secondary">Hồ sơ #{item.complaintId}</p></td><td className="p-4 whitespace-nowrap">{complaintDate(item.submittedAtUtc)}</td><td className="p-4 text-right font-semibold tabular-nums whitespace-nowrap">{complaintMoney(item.refundableAmount)}</td><td className="p-4"><span className="inline-block rounded-lg bg-soft-accent px-3 py-1.5 text-xs font-semibold text-primary">{complaintStatusLabel(item.status)}</span></td><td className="p-4 text-right"><Link className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 font-semibold text-primary hover:bg-soft-accent focus-visible:outline-2" href={ROUTES.admin.staffPostTripComplaint(item.complaintId)}>Chi tiết<span className="sr-only"> hồ sơ #{item.complaintId}</span></Link></td></tr>)}</tbody></table></div>}
      <div className="flex items-center justify-between gap-3"><ActionButton variant="outline" disabled={page <= 1} onClick={() => { setLoading(true); setPage(n => n - 1); }}>Trang trước</ActionButton><p className="text-sm">Trang {page} / {Math.max(1, Math.ceil(data.totalCount / data.pageSize))}</p><ActionButton variant="outline" disabled={page * data.pageSize >= data.totalCount} onClick={() => { setLoading(true); setPage(n => n + 1); }}>Trang sau</ActionButton></div>
    </>}
  </main>;
}
