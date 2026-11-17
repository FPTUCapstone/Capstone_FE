'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/lib/routes';
import { getPostTripComplaintContext } from '../services/postTripComplaintApi';
import { postTripComplaintEn as copy } from '../resources/en';

/** Booking-detail action that never infers complaint eligibility from the Trip History item. */
export function ComplaintEntryAction({ bookingId, disabled }: { bookingId: string; disabled: boolean }) {
  const [state, setState] = useState<'loading' | 'submit' | 'existing' | 'hidden'>('loading');
  useEffect(() => {
    if (disabled || !/^[1-9]\d*$/.test(bookingId)) return;
    const controller = new AbortController();
    getPostTripComplaintContext(bookingId, controller.signal)
      .then((context) => setState(context.complaint ? 'existing' : context.canSubmit ? 'submit' : 'hidden'))
      .catch(() => setState('hidden'));
    return () => controller.abort();
  }, [bookingId, disabled]);
  if (disabled || !/^[1-9]\d*$/.test(bookingId) || state === 'loading' || state === 'hidden') return null;
  const label = state === 'existing' ? 'View complaint' : copy.title;
  return <Link href={ROUTES.bookingComplaint(bookingId)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#174B4A] py-2 px-3 text-xs font-bold text-white shadow-2xs transition hover:bg-[#103B39] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40"><span className="material-symbols-outlined text-[16px]" aria-hidden="true">{state === 'existing' ? 'visibility' : 'report'}</span><span>{label}</span></Link>;
}
