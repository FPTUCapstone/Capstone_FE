'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { formatDateTime, formatVnd, type OperatorComplaintPage } from './operatorPostTripComplaints';
import { fetchOperatorComplaints, OperatorComplaintError } from './operatorPostTripComplaintsService';

export function OperatorComplaintListScreen() {
  const [data, setData] = useState<OperatorComplaintPage | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchOperatorComplaints(page, status || undefined, controller.signal).then(setData).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof OperatorComplaintError ? reason.message : 'Unable to load complaints.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, reload]);
  const refresh = () => {
    setLoading(true);
    setError(null);
    setReload((value) => value + 1);
  };
  const changeStatus = (value: string) => {
    setLoading(true);
    setError(null);
    setStatus(value);
    setPage(1);
  };
  const changePage = (nextPage: number) => {
    setLoading(true);
    setError(null);
    setPage(nextPage);
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 text-[#1C2928] md:px-8">
      <PageHeader
        className="mb-6"
        eyebrow="Post-trip complaints"
        title="Customer complaints"
        description="Review complaints for your tours and respond before the deadline."
      />
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-xs">
        <label className="text-xs font-bold uppercase tracking-wider text-[#5B6E69]" htmlFor="complaint-status">Status</label>
        <select
          id="complaint-status"
          value={status}
          onChange={(event) => changeStatus(event.target.value)}
          className="rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/60 px-3 py-2 text-sm font-semibold text-[#1C2928] outline-none focus:border-[#174B4A] focus:bg-white"
        >
          <option value="">All statuses</option>
          <option value="AwaitingOperatorResponse">Awaiting response</option>
          <option value="AwaitingTravelerResponse">Awaiting traveler response</option>
          <option value="AwaitingStaffReview">Awaiting Staff review</option>
          <option value="AwaitingStaffEvidence">Awaiting additional evidence</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
        </select>
      </div>
      {loading ? <div role="status" className="rounded-2xl border border-[#DCE2DD] bg-white p-6 text-sm text-[#5B6E69]">Loading complaints…</div> : null}
      {error ? <FeedbackAlert tone="error" title="Unable to load complaints"><p>{error}</p><button type="button" onClick={refresh} className="mt-3 rounded-lg border border-current px-3 py-1 font-bold">Retry</button></FeedbackAlert> : null}
      {!loading && !error ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[#DCE2DD] bg-white shadow-xs">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-xs font-bold uppercase tracking-wider text-[#5B6E69]">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3 text-right">Refundable</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.complaintId} className="border-t border-[#ECEEEB] transition hover:bg-[#F7F5EF]/50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-[#1C2928]">{item.bookingCode}</p>
                      <p className="max-w-48 truncate text-xs text-[#5B6E69]">{item.tourTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      {item.reasonCategory}
                      <p className="text-xs text-[#5B6E69]">{item.evidenceCount} evidence file(s)</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5B6E69]">{formatDateTime(item.responseDeadlineUtc)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-[#1C2928]">{formatVnd(item.refundableAmount)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-[#F2D8B3] bg-[#FBF3E8] px-2.5 py-0.5 text-xs font-bold text-[#8F5419]">{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link className="font-bold text-[#174B4A] hover:text-[#103B39] hover:underline" href={ROUTES.partner.postTripComplaint(item.complaintId)}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.items.length === 0 ? <p className="p-8 text-center text-sm text-[#5B6E69]">No complaints found.</p> : null}
          </div>
          <div className="mt-4 flex items-center justify-end gap-3 text-sm text-[#5B6E69]">
            <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2 text-xs font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:opacity-40">Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2 text-xs font-bold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:opacity-40">Next</button>
          </div>
        </>
      ) : null}
    </main>
  );
}
