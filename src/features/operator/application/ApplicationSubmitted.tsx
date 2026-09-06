import Link from 'next/link';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/routes';

export function ApplicationSubmitted() {
  return (
    <section className="rounded-3xl border border-[#9edbd2] bg-white p-6 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8" aria-labelledby="application-submitted-title">
      <StatusBadge tone="coral">Application Submitted</StatusBadge>
      <h2 id="application-submitted-title" className="mt-4 text-2xl font-extrabold text-[#00152a]">Your application is under review.</h2>
      <div className="mt-5">
        <FeedbackAlert tone="success">Your business profile has been submitted for verification. Admin review takes 1-2 business days.</FeedbackAlert>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Account</dt><dd className="mt-2 font-extrabold text-[#00152a]">Pending Approval</dd></div>
        <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Application</dt><dd className="mt-2 font-extrabold text-[#00152a]">Pending Review</dd></div>
      </dl>
      <p className="mt-6 text-sm leading-relaxed text-[#59616b]">Partner workspace functions remain locked until the application is approved.</p>
      <Link href={`${ROUTES.partner.application}?status=pending`} className="mt-6 flex min-h-11 items-center justify-center rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white hover:bg-[#006b5f]">View Application Status</Link>
    </section>
  );
}
