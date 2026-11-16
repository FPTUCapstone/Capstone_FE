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

export function MyPostTripComplaintsPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const load = async () => { setState({ kind: 'loading' }); try { setState({ kind: 'ready', complaints: await getMyPostTripComplaints() }); } catch { setState({ kind: 'error' }); } };
  useEffect(() => { void load(); }, []);
  if (state.kind === 'loading') return <p role="status" className="rounded-2xl border border-brand-border bg-white p-5 text-sm text-brand-textSecondary">Loading your complaints…</p>;
  if (state.kind === 'error') return <section role="alert" className="rounded-2xl border border-error/30 bg-error-container p-5"><h1 className="text-xl font-bold">Your complaints</h1><p className="mt-2 text-sm">Complaint details are unavailable. Please try again.</p><ActionButton type="button" variant="outline" className="mt-4" onClick={() => void load()}>Retry</ActionButton></section>;
  return <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">Booking management</p><h1 className="mt-2 text-2xl font-extrabold text-brand-textPrimary">My post-trip complaints</h1><p className="mt-2 text-sm text-brand-textSecondary">Review complaints submitted for your completed tours.</p></div>{state.complaints.length === 0 ? <p className="mt-6 rounded-xl bg-brand-lightTeal p-4 text-sm text-brand-textPrimary">You have not submitted any post-trip complaints.</p> : <ul className="mt-6 space-y-3">{state.complaints.map((complaint) => <li key={complaint.complaintId} className="rounded-xl border border-brand-border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="font-mono text-sm font-bold text-brand-textPrimary">{complaint.bookingCode}</p><h2 className="mt-1 truncate font-semibold text-brand-textPrimary">{complaint.tourTitle}</h2><p className="mt-2 text-sm text-brand-textSecondary">{copy.categories[complaint.reasonCategory]} · {complaint.evidenceCount} evidence file{complaint.evidenceCount === 1 ? '' : 's'}</p><p className="mt-1 text-xs text-brand-textSecondary">Submitted {formatDate(complaint.submittedAtUtc)} · Operator response due {formatDate(complaint.responseDeadlineUtc)}</p></div><div className="flex shrink-0 flex-col items-start gap-2 sm:items-end"><span className="rounded-full bg-brand-lightTeal px-3 py-1 text-xs font-semibold text-brand-teal">{complaint.status}</span><Link href={ROUTES.bookingComplaint(complaint.bookingId)} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand-teal underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40">View complaint</Link></div></div></li>)}</ul>}</section>;
}
