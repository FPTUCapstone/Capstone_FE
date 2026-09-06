'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { TextField } from '@/components/ui/FormControls';
import { simulateMockRequest } from '@/data/batchOneMock';
import { ROUTES } from '@/lib/routes';

type VerifyAccountFormProps = { email?: string };

export function VerifyAccountForm({ email }: VerifyAccountFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');
    if (!code.trim()) {
      setError('This field is required.');
      return;
    }
    if (code.trim().toLowerCase() === 'expired') {
      setError('Invalid or expired verification code. Please request a new OTP.');
      return;
    }
    setError('');
    setLoading(true);
    await simulateMockRequest();
    setLoading(false);
    setVerified(true);
  }

  async function handleResend() {
    setError('');
    setFeedback('');
    setLoading(true);
    await simulateMockRequest();
    setLoading(false);
    setFeedback('A replacement verification code was requested. Check your Email Address.');
  }

  if (verified) {
    return (
      <div className="space-y-5">
        <FeedbackAlert tone="success" title="Account verified">Your Traveler account is active. Continue to Sign In.</FeedbackAlert>
        <Link href={ROUTES.signIn} className="flex min-h-11 items-center justify-center rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white hover:bg-[#006b5f]">Continue to Sign In</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 text-center">
        <span className="material-symbols-outlined rounded-full bg-[#e8f7f4] p-4 text-4xl text-[#006b5f]" aria-hidden="true">mark_email_read</span>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#00152a]">Verify Account</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#59616b]">Enter the verification code sent to {email ? <strong className="text-[#314863]">{email}</strong> : 'your Email Address'}. Protected functions remain locked until verification succeeds.</p>
      </div>
      <form className="space-y-5" noValidate onSubmit={handleVerify}>
        <TextField label="Verification Code" name="verificationCode" autoComplete="one-time-code" placeholder="Enter verification code" value={code} disabled={loading} error={error} onChange={(event) => setCode(event.target.value)} />
        {feedback ? <FeedbackAlert>{feedback}</FeedbackAlert> : null}
        <ActionButton type="submit" variant="secondary" loading={loading} className="w-full">Verify</ActionButton>
        <ActionButton type="button" variant="outline" loading={loading} className="w-full" onClick={handleResend}>Resend Code</ActionButton>
      </form>
      <Link href={ROUTES.signIn} className="mt-6 flex justify-center text-sm font-bold text-[#006b5f] hover:underline">Back to Sign In</Link>
      <p className="mt-5 rounded-lg bg-[#f2f4f7] px-3 py-2 text-center text-[11px] leading-relaxed text-[#59616b]">Interactive prototype: verification is simulated locally. Enter “expired” to preview the invalid-code state.</p>
    </div>
  );
}
