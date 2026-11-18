'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { ROUTES } from '@/lib/routes';
import { getMyPostTripComplaints } from '../services/postTripComplaintApi';
import { postTripComplaintEn as copyOriginal } from '../resources/en';
import { postTripComplaintVi } from '../resources/vi';
import { useI18n } from '@/i18n';
import type { MyPostTripComplaint } from '../types/postTripComplaint';

type State = { kind: 'loading' } | { kind: 'ready'; complaints: readonly MyPostTripComplaint[] } | { kind: 'error' };

function formatDate(value: string): string { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)); }

export function MyPostTripComplaintsPage() {
  const { locale, hasProvider } = useI18n();
  const copy = hasProvider && locale === 'vi' ? postTripComplaintVi : copyOriginal;
  const isVi = hasProvider && locale === 'vi';
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

  if (state.kind === 'loading') return <p role="status" className="rounded-2xl border border-brand-border bg-white p-5 text-sm text-brand-textSecondary">{isVi ? 'Đang tải khiếu nại của bạn…' : 'Loading your complaints…'}</p>;
  if (state.kind === 'error') return <section role="alert" className="rounded-2xl border border-error/30 bg-error-container p-5"><h1 className="text-xl font-bold">{isVi ? 'Khiếu nại của bạn' : 'Your complaints'}</h1><p className="mt-2 text-sm">{copy.errors.unavailable}</p><ActionButton type="button" variant="outline" className="mt-4" onClick={handleRetry}>{copy.retry}</ActionButton></section>;
  return <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">{isVi ? 'Quản lý đặt chỗ' : 'Booking management'}</p><h1 className="mt-2 text-2xl font-extrabold text-brand-textPrimary">{isVi ? 'Khiếu nại sau chuyến đi của tôi' : 'My post-trip complaints'}</h1><p className="mt-2 text-sm text-brand-textSecondary">{isVi ? 'Xem lại các khiếu nại đã gửi cho các tour đã hoàn thành.' : 'Review complaints submitted for your completed tours.'}</p></div>{state.complaints.length === 0 ? <p className="mt-6 rounded-xl bg-brand-lightTeal p-4 text-sm text-brand-textPrimary">{isVi ? 'Bạn chưa gửi khiếu nại sau chuyến đi nào.' : 'You have not submitted any post-trip complaints.'}</p> : <ul className="mt-6 space-y-3">{state.complaints.map((complaint) => <li key={complaint.complaintId} className="rounded-xl border border-brand-border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="font-mono text-sm font-bold text-brand-textPrimary">{complaint.bookingCode}</p><h2 className="mt-1 truncate font-semibold text-brand-textPrimary">{complaint.tourTitle}</h2><p className="mt-2 text-sm text-brand-textSecondary">{copy.categories[complaint.reasonCategory]} · {complaint.evidenceCount} {isVi ? 'tài liệu bằng chứng' : `evidence file${complaint.evidenceCount === 1 ? '' : 's'}`}</p><p className="mt-1 text-xs text-brand-textSecondary">{copy.submittedAt} {formatDate(complaint.submittedAtUtc)} · {copy.responseDeadline} {formatDate(complaint.responseDeadlineUtc)}</p></div><div className="flex shrink-0 flex-col items-start gap-2 sm:items-end"><span className="rounded-full bg-brand-lightTeal px-3 py-1 text-xs font-semibold text-brand-teal">{complaint.status}</span><Link href={ROUTES.bookingComplaint(complaint.bookingId)} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand-teal underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40">{isVi ? 'Xem khiếu nại' : 'View complaint'}</Link></div></div></li>)}</ul>}</section>;
}
