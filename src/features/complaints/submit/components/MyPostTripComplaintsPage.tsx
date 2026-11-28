'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { ROUTES } from '@/lib/routes';
import { getMyPostTripComplaints } from '../services/postTripComplaintApi';
import { postTripComplaintEn as copy } from '../resources/en';
import type { MyPostTripComplaint } from '../types/postTripComplaint';

type State = { kind: 'loading' } | { kind: 'ready'; complaints: readonly MyPostTripComplaint[] } | { kind: 'error' };

function formatDate(value: string): string { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)); }

function responseActionCopy(status: string): string {
  if (status === 'AwaitingStaffReview') return 'View Staff review';
  if (status === 'AwaitingStaffEvidence') return 'View evidence request';
  return status === 'AwaitingTravelerResponse' ? 'Review refund proposal' : 'View operator response';
}

export function MyPostTripComplaintsPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    getMyPostTripComplaints()
      .then((complaints) => {
        if (!active) return;
        setState({ kind: 'ready', complaints });
      })
      .catch(() => {
        if (!active) return;
        setState({ kind: 'error' });
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const handleRetry = () => {
    setState({ kind: 'loading' });
    setReloadToken((prev) => prev + 1);
  };

  if (state.kind === 'loading') return <p role="status" className="rounded-2xl border border-brand-border bg-white p-5 text-sm text-brand-textSecondary">Loading your complaints…</p>;
  if (state.kind === 'error') return <section role="alert" className="rounded-2xl border border-error/30 bg-error-container p-5"><h1 className="text-xl font-bold">Your complaints</h1><p className="mt-2 text-sm">Complaint details are unavailable. Please try again.</p><ActionButton type="button" variant="outline" className="mt-4" onClick={handleRetry}>Retry</ActionButton></section>;
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">Booking management</p>
        <h1 className="mt-2 text-2xl font-extrabold text-brand-textPrimary">My post-trip complaints</h1>
        <p className="mt-2 text-sm text-brand-textSecondary">
          Review complaints submitted for your completed tours and the Tour Operator&apos;s response.
        </p>
      </div>
      {state.complaints.length === 0 ? (
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-[#DCE2DD] bg-[#F7F5EF]/70 p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EA] text-[#174B4A]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                task_alt
              </span>
            </span>
            <div>
              <p className="text-sm font-bold text-[#1C2928]">
                You have not submitted any post-trip complaints.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#5B6E69]">
                If something went wrong on a completed tour booking, open the booking from your trip history to submit a complaint.
              </p>
            </div>
          </div>
          <Link
            href={ROUTES.account.trips}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#103B39] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A]"
          >
            <span>View my trips</span>
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {state.complaints.map((complaint) => (
            <li key={complaint.complaintId} className="rounded-xl border border-brand-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-brand-textPrimary">{complaint.bookingCode}</p>
                  <h2 className="mt-1 truncate font-semibold text-brand-textPrimary">{complaint.tourTitle}</h2>
                  <p className="mt-2 text-sm text-brand-textSecondary">
                    {copy.categories[complaint.reasonCategory]} · {complaint.evidenceCount} evidence file
                    {complaint.evidenceCount === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-xs text-brand-textSecondary">
                    Submitted {formatDate(complaint.submittedAtUtc)} · Operator response due {formatDate(complaint.responseDeadlineUtc)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <span className="self-start rounded-full bg-brand-lightTeal px-3 py-1 text-xs font-semibold text-brand-teal sm:self-end">
                    {complaint.status}
                  </span>
                  <Link
                    href={['AwaitingStaffReview', 'AwaitingStaffEvidence'].includes(complaint.status) ? ROUTES.bookingComplaint(complaint.bookingId) : ROUTES.account.partialRefundProposal(complaint.complaintId)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-teal px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"
                  >
                    {responseActionCopy(complaint.status)}
                  </Link>
                  <Link
                    href={ROUTES.bookingComplaint(complaint.bookingId)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-teal bg-white px-3 text-sm font-semibold text-brand-teal transition-colors hover:bg-brand-lightTeal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"
                  >
                    View complaint
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
