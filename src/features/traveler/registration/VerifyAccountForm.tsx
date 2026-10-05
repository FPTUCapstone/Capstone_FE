'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { isTooManyRequestsError, mapFirebaseAuthError } from '@/lib/authErrorMapper';
import { useVerificationEmailCooldown } from '@/lib/useVerificationEmailCooldown';
import { ROUTES } from '@/lib/routes';

type Feedback = {
  tone: 'info' | 'error' | 'success' | 'warning';
  message: string;
};

type VerifyAccountFormProps = { deliveryFailed?: boolean; email?: string; flow?: string };

export function VerifyAccountForm({ deliveryFailed = false, email = '', flow }: VerifyAccountFormProps) {
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
  const [recoveryEmail, setRecoveryEmail] = useState(email);
  const [recoveryPassword, setRecoveryPassword] = useState('');

  // 60-second cooldown for resending verification email
  const { secondsLeft, isOnCooldown, startCooldown } = useVerificationEmailCooldown(60);

  async function handleResendEmail() {
    if (isOnCooldown || resending) return;
    setFeedback(null);
    setResending(true);

    try {
      if (flow === 'operator' && !recoveryEmail.trim()) {
        setFeedback({ tone: 'error', message: 'Enter the registration email before requesting a new link.' });
        return;
      }
      let user = getFirebaseAuth().currentUser;
      if (flow === 'operator' && recoveryEmail.trim() &&
          user?.email?.toLowerCase() !== recoveryEmail.trim().toLowerCase() && recoveryPassword) {
        user = (await signInWithEmailAndPassword(getFirebaseAuth(), recoveryEmail.trim(), recoveryPassword)).user;
      }
      if (!user || (flow === 'operator' && recoveryEmail.trim() &&
          user.email?.toLowerCase() !== recoveryEmail.trim().toLowerCase())) {
        setFeedback({
          tone: 'info',
          message: 'Your registration session has expired. Please sign in to request a new verification link.',
        });
        return;
      }

      const actionCodeSettings = {
        url: `${window.location.origin}/verify-email${flow === 'operator' ? '?flow=operator' : ''}`,
        handleCodeInApp: true,
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
    <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100 text-center">
      {/* Icon Header */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lightTeal text-brand-teal border border-brand-teal/20 shadow-sm">
        <span className="material-symbols-outlined text-3xl">mark_email_read</span>
      </div>

      <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">
        Check your email
      </h2>

      <p className="text-sm text-brand-textSecondary leading-relaxed max-w-sm mx-auto mb-4">
        {deliveryFailed
          ? 'Use the button below to request a new verification link, then check your inbox to activate your account.'
          : 'We have sent a verification link to your registered email address. Please check your inbox and click the link to activate your account.'}
      </p>

      {email ? (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-lightTeal px-4 py-1.5 text-xs font-semibold text-brand-teal">
          <span className="material-symbols-outlined text-base">mail</span>
          <span>{email}</span>
        </div>
      ) : null}

      {feedback ? (
        <div className="mb-6 text-left">
          <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
        </div>
      ) : null}

      <div className="space-y-3">
        {flow === 'operator' ? (
          <>
            <label className="block text-left text-sm font-semibold text-brand-navy">
              Registration email
              <input type="email" autoComplete="email" value={recoveryEmail}
                onChange={(event) => setRecoveryEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-left text-sm font-semibold text-brand-navy">
              Password to restore your registration session
              <input type="password" autoComplete="current-password" value={recoveryPassword}
                onChange={(event) => setRecoveryPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>
          </>
        ) : null}
        <button
          type="button"
          disabled={isOnCooldown || resending}
          aria-busy={resending}
          onClick={handleResendEmail}
          className="group w-full h-12 bg-brand-teal hover:bg-brand-brightTeal active:scale-[0.98] text-white font-semibold text-base rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
          ) : (
            <>
              <span>{isOnCooldown ? `Resend Email (${secondsLeft}s)` : 'Resend Verification Email'}</span>
              <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                send
              </span>
            </>
          )}
        </button>

        <Link
          href={ROUTES.signIn}
          className="w-full h-12 bg-white hover:bg-slate-50 active:scale-[0.98] border border-[#CBD5E1] rounded-xl text-[#1E293B] font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
        >
          <span>Proceed to Sign In</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
