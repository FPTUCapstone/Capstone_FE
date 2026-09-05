import Link from 'next/link';

import { PartnerShell } from '@/components/layout/PartnerShell';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockOperatorApplication } from '@/data/batchOneMock';
import { ROUTES } from '@/lib/routes';
import type { OperatorApplicationStatus } from '@/data/batchOneMock';

type Props = { status: OperatorApplicationStatus };

const variants: { id: OperatorApplicationStatus; label: string }[] = [
  { id: 'pending', label: 'Pending Review' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'approved', label: 'Approved' },
];

export function OperatorApplicationStatusPage({ status }: Props) {
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  return (
    <PartnerShell title="Operator Application Status" description="One approved page presents Pending Review, Rejected, and Approved variants while access remains governed by the latest application decision.">
      <div className="mb-6 rounded-2xl border border-[#d8dadd] bg-white p-3" aria-label="Prototype status variants">
        <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-[#74777e]">Prototype variant</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {variants.map((variant) => (
            <Link key={variant.id} href={`${ROUTES.partner.application}?status=${variant.id}`} aria-current={status === variant.id ? 'page' : undefined} className={`rounded-xl px-4 py-2.5 text-center text-sm font-bold ${status === variant.id ? 'bg-[#00152a] text-white' : 'bg-[#f2f4f7] text-[#314863] hover:bg-[#e0e3e6]'}`}>
              {variant.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="rounded-3xl border border-[#d8dadd] bg-white p-6 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StatusBadge tone={isPending ? 'warning' : isRejected ? 'danger' : 'teal'}>{isPending ? 'Pending Review' : isRejected ? 'Rejected' : 'Approved'}</StatusBadge>
            <h2 className="mt-4 text-2xl font-extrabold text-[#00152a]">{isPending ? 'Application under review' : isRejected ? 'Corrections required' : 'Application approved'}</h2>
          </div>
          <span className="font-mono text-xs font-bold text-[#59616b]">{mockOperatorApplication.id}</span>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#59616b]">
          {isPending ? 'Your Tour Operator account is pending verification. You will be notified once approved.' : isRejected ? 'The latest review found information that must be corrected before another submission.' : 'The business application is approved and the Tour Operator account is Active.'}
        </p>

        {isRejected ? <div className="mt-6"><FeedbackAlert tone="error" title="Latest rejection reason">{mockOperatorApplication.rejectionReason}</FeedbackAlert></div> : null}

        <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Account</dt><dd className="mt-2 font-extrabold text-[#00152a]">{isPending ? 'Pending Approval' : isRejected ? 'Restricted' : 'Active'}</dd></div>
          <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Application</dt><dd className="mt-2 font-extrabold text-[#00152a]">{isPending ? 'Pending Review' : isRejected ? 'Rejected' : 'Approved'}</dd></div>
          <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Submitted</dt><dd className="mt-2 font-extrabold text-[#00152a]">{mockOperatorApplication.submittedAt}</dd></div>
          <div className="rounded-2xl bg-[#f2f4f7] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#74777e]">Resubmissions</dt><dd className="mt-2 font-extrabold text-[#00152a]">{mockOperatorApplication.resubmissionCount}</dd></div>
        </dl>

        <div className="mt-7 border-t border-[#d8dadd] pt-6">
          {isPending ? <FeedbackAlert>Partner workspace access remains locked. No Resubmit action is available while this application is under review.</FeedbackAlert> : null}
          {isRejected ? <Link href={ROUTES.partner.resubmitApplication} className="flex min-h-11 items-center justify-center rounded-xl bg-[#eb5b49] px-5 py-3 text-sm font-bold text-white hover:bg-[#d94b3a] sm:ml-auto sm:w-fit">Resubmit Application</Link> : null}
          {!isPending && !isRejected ? (
            <div className="space-y-3">
              <FeedbackAlert tone="success">Partner workspace access is available for an approved application.</FeedbackAlert>
              <button type="button" disabled className="flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white opacity-60 sm:ml-auto sm:w-fit" title="Tour Operator workspace route is outside Batch 1">Enter Tour Operator Workspace</button>
              <p className="text-right text-xs text-[#74777e]">Workspace navigation awaits the approved authenticated workspace route.</p>
            </div>
          ) : null}
        </div>
      </section>
    </PartnerShell>
  );
}
