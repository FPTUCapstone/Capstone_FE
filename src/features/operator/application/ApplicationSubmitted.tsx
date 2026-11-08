import Link from 'next/link';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function ApplicationSubmitted({ email, deliveryFailed }: { email: string; deliveryFailed: boolean }) {
  return (
    <section className="rounded-3xl border border-[#9edbd2] bg-white p-6 shadow-[0_16px_45px_rgba(0,21,42,0.08)] sm:p-8" aria-labelledby="application-submitted-title">
      <StatusBadge tone="coral">Application Submitted</StatusBadge>
      <h2 id="application-submitted-title" className="mt-4 text-2xl font-extrabold text-[#1C2928]">Your application is under review.</h2>
      <div className="mt-5">
        <FeedbackAlert tone="success">Your business profile has been submitted for verification. Admin review takes 1-2 business days.</FeedbackAlert>
      </div>
      <div className="mt-4">
        <FeedbackAlert tone={deliveryFailed ? 'warning' : 'info'}>
          {deliveryFailed
            ? 'Your application was saved, but the verification email could not be sent. Request a new link below.'
            : 'Account registered successfully! Please verify your email/OTP to activate your account.'}
        </FeedbackAlert>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#F7F5EF] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#5B6E69]">Account</dt><dd className="mt-2 font-extrabold text-[#1C2928]">Pending Approval</dd></div>
        <div className="rounded-2xl bg-[#F7F5EF] p-4"><dt className="text-xs font-bold uppercase tracking-wide text-[#5B6E69]">Application</dt><dd className="mt-2 font-extrabold text-[#1C2928]">Pending Review</dd></div>
      </dl>
      <p className="mt-6 text-sm leading-relaxed text-[#5B6E69]">Partner workspace functions remain locked until the application is approved.</p>
      <Link href={`/verify-account?flow=operator&email=${encodeURIComponent(email)}${deliveryFailed ? '&delivery=failed' : ''}`} className="mt-6 flex min-h-11 items-center justify-center rounded-xl bg-[#103B39] px-5 py-3 text-sm font-bold text-white hover:bg-[#174B4A]">Continue to Email Verification</Link>
    </section>
  );
}
