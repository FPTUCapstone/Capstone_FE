'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/lib/routes';
import { getPostTripComplaintContext } from '../services/postTripComplaintApi';
import type { PostTripComplaintContext } from '../types/postTripComplaint';
import { postTripComplaintEn as copy } from '../resources/en';

type State = { phase: 'loading' } | { phase: 'error' } | { phase: 'ready'; context: PostTripComplaintContext };

function ineligibleMessage(reason: string | null): string {
  if (reason === 'complaint.tour_not_ended') return 'Tour chưa kết thúc theo thời gian của hệ thống.';
  if (reason === 'complaint.window_closed') return 'Đã hết thời hạn gửi khiếu nại sau tour.';
  if (reason === 'complaint.booking_status_ineligible') return 'Trạng thái đơn đặt tour chưa đủ điều kiện khiếu nại.';
  return 'Đơn đặt tour hiện chưa đủ điều kiện gửi khiếu nại.';
}

/** The detail dialog uses authoritative eligibility, never a browser-date inference. */
export function ComplaintEntryAction({ bookingId, disabled }: { bookingId: string; disabled: boolean }) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (disabled || !/^[1-9]\d*$/.test(bookingId)) return;
    const controller = new AbortController();
    getPostTripComplaintContext(bookingId, controller.signal)
      .then(context => { if (!controller.signal.aborted) setState({ phase: 'ready', context }); })
      .catch(() => { if (!controller.signal.aborted) setState({ phase: 'error' }); });
    return () => controller.abort();
  }, [bookingId, disabled, attempt]);
  if (disabled || !/^[1-9]\d*$/.test(bookingId)) return null;
  if (state.phase === 'loading') return <p role="status" className="text-xs text-slate-500">Đang kiểm tra điều kiện khiếu nại…</p>;
  if (state.phase === 'error') return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><p>Chưa thể kiểm tra điều kiện khiếu nại.</p><button type="button" onClick={() => { setState({ phase: 'loading' }); setAttempt(value => value + 1); }} className="mt-2 font-semibold underline">Thử lại</button></div>;
  const context = state.context;
  if (!context.complaint && !context.canSubmit) return <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{ineligibleMessage(context.ineligibilityReason)}</p>;
  const label = context.complaint ? 'View complaint' : copy.title;
  return <Link href={ROUTES.bookingComplaint(bookingId)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#174B4A] py-2 px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-[#103B39] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"><span className="material-symbols-outlined text-[16px]" aria-hidden="true">{context.complaint ? 'visibility' : 'report'}</span><span>{label}</span></Link>;
}
