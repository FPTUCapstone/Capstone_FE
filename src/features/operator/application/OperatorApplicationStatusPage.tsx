'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PartnerShell } from '@/components/layout/PartnerShell';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/routes';
import { getOperatorApplication, OperatorApplicationError, type OperatorApplication } from './operatorApplicationApi';
import { operatorMessage } from './operatorMessages';

function dateTime(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('vi-VN');
}

export function OperatorApplicationStatusPage() {
  const [application, setApplication] = useState<OperatorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getOperatorApplication(controller.signal)
      .then(setApplication)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof OperatorApplicationError && reason.status === 401) {
          window.location.assign(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.partner.application)}`);
          return;
        }
        setError(reason instanceof OperatorApplicationError && reason.status === 404
          ? 'Tour Operator application not found.' : operatorMessage('MSG127'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  if (loading) {
    return <PartnerShell title="Operator Application Status" description="Loading your current application."><div role="status" className="h-40 animate-pulse rounded-3xl bg-white"><span className="sr-only">Loading application</span></div></PartnerShell>;
  }
  if (error || !application) {
    return <PartnerShell title="Operator Application Status" description="Review your application state."><FeedbackAlert tone="error" title="Unable to load application">{error ?? operatorMessage('MSG127')}</FeedbackAlert><button type="button" className="mt-4 rounded-xl bg-[#00152a] px-5 py-3 font-bold text-white" onClick={() => { setLoading(true); setError(null); setApplication(null); setReload((value) => value + 1); }}>Retry</button></PartnerShell>;
  }

  const rejected = application.approvalStatus === 'Rejected';
  const pending = application.approvalStatus === 'PendingApproval';
  return (
    <PartnerShell title="Operator Application Status" description="Review the latest state of your Tour Operator application.">
      <section className="rounded-3xl border border-[#d8dadd] bg-white p-6 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><StatusBadge tone={pending ? 'warning' : rejected ? 'danger' : 'teal'}>{pending ? 'Pending Review' : application.approvalStatus}</StatusBadge><h2 className="mt-4 text-2xl font-extrabold text-[#00152a]">{application.companyName}</h2></div>
          <span className="font-mono text-xs font-bold text-[#59616b]">Application #{application.userId}</span>
        </div>
        {rejected && <div className="mt-6"><FeedbackAlert tone="error" title="Latest rejection reason">{application.rejectionReason || 'No reason recorded.'}</FeedbackAlert><p className="mt-2 text-xs text-[#59616b]">Reviewed: {dateTime(application.reviewedAtUtc)}</p></div>}
        {pending && <div className="mt-6"><FeedbackAlert>Partner workspace access remains locked while the application is under review.</FeedbackAlert></div>}
        {!pending && !rejected && <div className="mt-6"><FeedbackAlert tone="success">Your application is approved.</FeedbackAlert></div>}
        <dl className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase text-[#74777e]">Account</dt><dd className="mt-2 font-extrabold text-[#00152a]">{application.userStatus}</dd></div>
          <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase text-[#74777e]">Application</dt><dd className="mt-2 font-extrabold text-[#00152a]">{application.approvalStatus}</dd></div>
          <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase text-[#74777e]">Resubmissions</dt><dd className="mt-2 font-extrabold text-[#00152a]">{application.resubmissionCount}</dd></div>
        </dl>
        <div className="mt-7 space-y-3 border-t border-[#d8dadd] pt-6">
          <h3 className="font-extrabold text-[#00152a]">Documents</h3>
          {application.documents.map((document) => <div key={document.documentId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><span className="font-semibold">{document.documentType} #{document.documentId} · {document.status}</span>{document.downloadUrl ? <a href={document.downloadUrl} target="_blank" rel="noreferrer" className="font-bold text-[#007d6e]">View document</a> : <span className="text-sm text-[#74777e]">Unavailable</span>}</div>)}
          {rejected && <Link href={ROUTES.partner.resubmitApplication} className="flex min-h-11 items-center justify-center rounded-xl bg-[#eb5b49] px-5 py-3 text-sm font-bold text-white sm:ml-auto sm:w-fit">Resubmit Application</Link>}
        </div>
      </section>
    </PartnerShell>
  );
}
