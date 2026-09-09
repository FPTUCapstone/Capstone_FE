'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendEmailVerification } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { isTooManyRequestsError, mapFirebaseAuthError } from '@/lib/authErrorMapper';
import { useVerificationEmailCooldown } from '@/lib/useVerificationEmailCooldown';
import { ROUTES } from '@/lib/routes';

type Feedback = {
  tone: 'info' | 'error' | 'success' | 'warning';
  message: string;
};

type VerifyAccountFormProps = { deliveryFailed?: boolean; email?: string };

export function VerifyAccountForm({ deliveryFailed = false, email = '' }: VerifyAccountFormProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(
    deliveryFailed
      ? {
          tone: 'warning',
          message:
            'The first verification email could not be delivered. Please request a new link below.',
        }
      : null,
  );
  const [resending, setResending] = useState(false);

  // 60-second cooldown for resending verification email
  const { secondsLeft, isOnCooldown, startCooldown } = useVerificationEmailCooldown(60);

  async function handleResendEmail() {
    if (isOnCooldown || resending) return;
    setFeedback(null);
    setResending(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setFeedback({
          tone: 'info',
          message: 'Your registration session has expired. Please sign in to request a new verification link.',
        });
        return;
      }

      const actionCodeSettings = {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      };

      await sendEmailVerification(user, actionCodeSettings);
      startCooldown();
      setFeedback({
        tone: 'success',
        message: 'A fresh verification link has been sent to your email address.',
      });
    } catch (err: unknown) {
      if (isTooManyRequestsError(err)) {
        startCooldown();
        setFeedback({
          tone: 'error',
          message: 'Too many resend attempts. Please wait a few minutes before trying again.',
        });
        return;
      }
      setFeedback({
        tone: 'error',
        message: mapFirebaseAuthError(
          err,
          'Unable to send verification email. Please try again later or sign in.',
        ),
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="text-center py-2">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE] shadow-xs">
        <span className="material-symbols-outlined text-3xl">mark_email_read</span>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-[#0F1B2D]">
        Check your email
      </h2>
      
      <p className="mt-2 text-xs leading-relaxed text-[#6B7C97] max-w-sm mx-auto">
        {deliveryFailed
          ? 'Use the button below to request a new verification link, then check your inbox to activate your account.'
          : 'We have sent a verification link to your registered email address. Please check your inbox and click the link to activate your account.'}
      </p>

      {email ? (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
          <span className="material-symbols-outlined text-sm">mail</span>
          <span>{email}</span>
        </div>
      ) : null}

      {feedback ? (
        <div className="mt-4 text-left">
          <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <ActionButton
          type="button"
          variant="primary"
          loading={resending}
          disabled={isOnCooldown || resending}
          className="w-full"
          onClick={handleResendEmail}
        >
          {isOnCooldown ? `Resend Email (${secondsLeft}s)` : 'Resend Verification Email'}
        </ActionButton>

        <Link
          href={ROUTES.signIn}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#E1E8F3] bg-white text-xs font-bold text-[#43474d] hover:bg-[#F4F7FC] transition"
        >
          Proceed to Sign In
        </Link>
      </div>
    </div>
  );
}
