'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DIRECT_REFUND_STATUSES, formatVnd, type DirectRefundStatus } from '@/features/bookings/types/directRefund';

type Scope = 'admin' | 'operator';
type CaseRow = { caseId: number; bookingCode: string; status: DirectRefundStatus; refundAmountVnd: number; createdAtUtc: string };
type ListData = { items: CaseRow[]; totalCount: number };
type State = { phase: 'loading' | 'error' } | { phase: 'ready'; data: ListData };
const PAGE_SIZE = 20;
const STATUS_LABELS: Record<DirectRefundStatus, string> = {
  AwaitingRecipient: 'Chờ thông tin nhận tiền', AwaitingTransfer: 'Chờ TO chuyển tiền',
  AwaitingTravelerConfirmation: 'Chờ khách xác nhận', Disputed: 'Đang tranh chấp', Completed: 'Đã hoàn tất',
};
const STATUS_TONES: Record<DirectRefundStatus, string> = {
  AwaitingRecipient: 'border-slate-200 bg-slate-50 text-slate-700',
  AwaitingTransfer: 'border-amber-200 bg-amber-50 text-amber-800',
  AwaitingTravelerConfirmation: 'border-blue-200 bg-blue-50 text-blue-800',
  Disputed: 'border-rose-200 bg-rose-50 text-rose-800',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

function parseList(value: unknown): ListData {
  if (!value || typeof value !== 'object') throw new Error('Invalid list');
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.items) || typeof data.totalCount !== 'number' || !Number.isSafeInteger(data.totalCount) || data.totalCount < 0) throw new Error('Invalid list');
  const items = data.items.map((item: unknown): CaseRow => {
    if (!item || typeof item !== 'object') throw new Error('Invalid row');
    const row = item as Record<string, unknown>;
    if (typeof row.caseId !== 'number' || !Number.isSafeInteger(row.caseId) || row.caseId <= 0 ||
      typeof row.bookingCode !== 'string' || typeof row.status !== 'string' || !DIRECT_REFUND_STATUSES.includes(row.status as DirectRefundStatus) ||
      typeof row.refundAmountVnd !== 'number' || !Number.isSafeInteger(row.refundAmountVnd) || row.refundAmountVnd < 0 ||
      typeof row.createdAtUtc !== 'string' || !Number.isFinite(Date.parse(row.createdAtUtc))) throw new Error('Invalid row');
    return row as CaseRow;
  });
  return { items, totalCount: data.totalCount };
}

export function DirectRefundCaseListScreen({ scope }: { scope: Scope }) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [status, setStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [revision, setRevision] = useState(0);
  const api = scope === 'admin' ? '/api/v1/admin/direct-refund-disputes' : '/api/v1/operator/direct-refunds';
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setState({ phase: 'loading' });
      const query = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: String(PAGE_SIZE) });
      if (status) query.set('status', status);
      void fetch(`${api}?${query}`, { cache: 'no-store', signal: controller.signal })
        .then(async response => {
          if (!response.ok) throw new Error('Unavailable');
          return parseList(await response.json());
        })
        .then(data => { if (!controller.signal.aborted) setState({ phase: 'ready', data }); })
        .catch(() => { if (!controller.signal.aborted) setState({ phase: 'error' }); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [api, status, pageNumber, revision]);

  const data = state.phase === 'ready' ? state.data : null;
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;
  const refresh = () => { setPageNumber(1); setRevision(value => value + 1); };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B6E69]">{scope === 'admin' ? 'Quản lý tranh chấp' : 'Quản lý hoàn tiền'}</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1C2928]">{scope === 'admin' ? 'Tranh chấp hoàn tiền' : 'Hồ sơ hoàn tiền trực tiếp'}</h1>
          <p className="mt-2 text-sm text-[#5B6E69]">{scope === 'admin' ? 'Theo dõi tranh chấp và tra cứu các hồ sơ đã xử lý.' : 'Theo dõi hoàn tiền, tranh chấp và phản hồi của khách hàng.'}</p>
        </div>
        <button type="button" onClick={refresh} disabled={state.phase === 'loading'} className="rounded-xl border border-[#DCE2DD] bg-white px-4 py-2 text-sm font-semibold text-[#174B4A] disabled:opacity-50">Làm mới</button>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE2DD] bg-white px-4 py-3">
        <label className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#1C2928]">
          Trạng thái
          <select value={status} onChange={event => { setStatus(event.target.value); setPageNumber(1); }} className="max-w-full rounded-lg border border-[#DCE2DD] bg-white px-3 py-2 font-normal">
            <option value="">Tất cả trạng thái</option>
            {DIRECT_REFUND_STATUSES.map(value => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
          </select>
        </label>
        {data && <p className="text-sm text-[#5B6E69]"><strong className="text-[#1C2928]">{data.totalCount}</strong> hồ sơ</p>}
      </div>
      {state.phase === 'loading' && <div role="status" className="rounded-xl border border-[#DCE2DD] bg-white px-5 py-14 text-center text-sm text-[#5B6E69]">Đang tải danh sách hồ sơ…</div>}
      {state.phase === 'error' && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><p className="text-sm text-rose-800">Chưa thể tải danh sách hồ sơ. Vui lòng thử lại.</p><button type="button" onClick={refresh} className="mt-3 rounded-lg bg-[#174B4A] px-4 py-2 text-sm font-semibold text-white">Thử lại</button></div>}
      {data && <div className="overflow-hidden rounded-xl border border-[#DCE2DD] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Danh sách hồ sơ hoàn tiền</caption>
            <thead className="bg-[#F7F9F8] text-xs text-[#5B6E69]"><tr>
              {['Hồ sơ', 'Mã đặt tour', 'Trạng thái', 'Số tiền hoàn', 'Ngày mở', 'Thao tác'].map((label, index) => <th key={label} scope="col" className={`px-4 py-4 font-semibold ${index === 3 || index === 5 ? 'text-right' : 'text-left'}`}>{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-[#EDF1EE]">
              {data.items.map(row => <tr key={row.caseId} className="hover:bg-[#F7F9F8]">
                <td className="px-4 py-5 font-semibold text-[#1C2928]">#{row.caseId}</td>
                <td className="px-4 py-5 font-mono text-xs font-semibold text-[#1C2928]">{row.bookingCode}</td>
                <td className="px-4 py-5"><span className={`inline-flex min-w-36 justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${STATUS_TONES[row.status]}`}>{STATUS_LABELS[row.status]}</span></td>
                <td className="whitespace-nowrap px-4 py-5 text-right font-semibold tabular-nums text-[#1C2928]">{formatVnd(row.refundAmountVnd)}</td>
                <td className="whitespace-nowrap px-4 py-5 text-[#5B6E69]">{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(row.createdAtUtc))}</td>
                <td className="px-4 py-5 text-right"><Link aria-label={`Chi tiết hồ sơ #${row.caseId}`} href={scope === 'admin' ? `/admin/direct-refund-disputes/${row.caseId}` : `/partner/refunds/direct/${row.caseId}`} className="inline-flex whitespace-nowrap rounded-lg border border-[#DCE2DD] px-3 py-2 text-xs font-semibold text-[#174B4A] hover:bg-[#E8F0EA]">Chi tiết</Link></td>
              </tr>)}
              {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-14 text-center text-[#5B6E69]">Chưa có hồ sơ phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
        <nav aria-label="Phân trang hồ sơ" className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE2DD] px-4 py-3 text-sm text-[#5B6E69]">
          <span>Trang {pageNumber} / {totalPages}</span>
          <div className="flex gap-2"><button type="button" onClick={() => setPageNumber(page => Math.max(1, page - 1))} disabled={pageNumber <= 1} className="rounded-lg border border-[#DCE2DD] px-3 py-2 disabled:opacity-40">Trang trước</button><button type="button" onClick={() => setPageNumber(page => page + 1)} disabled={pageNumber >= totalPages} className="rounded-lg border border-[#DCE2DD] px-3 py-2 disabled:opacity-40">Trang sau</button></div>
        </nav>
      </div>}
    </section>
  );
}
