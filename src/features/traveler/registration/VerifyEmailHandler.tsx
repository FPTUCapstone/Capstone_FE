'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { applyActionCode, checkActionCode } from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { saveTokens, verifyEmail } from '@/lib/authApi';
import { mapFirebaseAuthError } from '@/lib/authErrorMapper';

interface VerifyEmailHandlerProps {
  mode?: string;
  oobCode?: string;
}

export function VerifyEmailHandler({ mode, oobCode }: VerifyEmailHandlerProps) {
  const isInitialValid = mode === 'verifyEmail' && Boolean(oobCode);
  const [status, setStatus] = useState<'verifying' | 'success' | 'incomplete' | 'error'>(
    isInitialValid ? 'verifying' : 'error'
  );
  const [errorMessage, setErrorMessage] = useState(
    isInitialValid ? '' : 'Missing verification code or invalid mode.'
  );

  useEffect(() => {
    if (!isInitialValid || !oobCode) {
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const auth = getFirebaseAuth();
        const actionCodeInfo = await checkActionCode(auth, oobCode as string);
        await applyActionCode(auth, oobCode as string);
        const currentUser = auth.currentUser;

        if (!currentUser) {
          if (isMounted) {
            setErrorMessage(
              'Your email was verified with Firebase, but TripMate could not activate your account because this browser has no registration session. Please sign in to finish activation.',
            );
            setStatus('incomplete');
          }
          return;
        }

        const verifiedEmail = actionCodeInfo.data.email;
        if (
          !verifiedEmail ||
          !currentUser.email ||
          currentUser.email.toLowerCase() !== verifiedEmail.toLowerCase()
        ) {
          if (isMounted) {
            setErrorMessage(
              'The verification link does not match the signed-in registration session. Please sign in with the verified email to finish activation.',
            );
            setStatus('incomplete');
          }
          return;
        }

        try {
          await currentUser.reload();
          const idToken = await currentUser.getIdToken(true);
          const res = await verifyEmail(idToken);
          saveTokens(res.accessToken, res.refreshToken);
        } catch {
          if (isMounted) {
            setErrorMessage(
              'Your email was verified, but TripMate could not activate your account. Please sign in to finish activation.',
            );
            setStatus('incomplete');
          }
          return;
        }

        if (isMounted) {
          setStatus('success');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            mapFirebaseAuthError(
              err,
              'The verification link is invalid, expired, or has already been used.',
            ),
          );
        }
      }
    }

    void verify();

    return () => {
      isMounted = false;
    };
  }, [isInitialValid, mode, oobCode]);

  if (status === 'verifying') {
    return (
      <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100 text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
        <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">Verifying Email...</h2>
        <p className="text-sm text-brand-textSecondary leading-relaxed">
          Please wait while we confirm your email verification link.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lightTeal text-brand-teal border border-brand-teal/20 shadow-sm">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
        </div>
        <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">
          Email Verified!
        </h2>
        <p className="text-sm text-brand-textSecondary leading-relaxed max-w-sm mx-auto mb-8">
          Your email address has been verified successfully. Please sign in to activate your account and start your journey with TripMate.
        </p>

        <Link
          href={ROUTES.signIn}
          className="w-full h-12 bg-brand-teal hover:bg-brand-brightTeal active:scale-[0.98] text-white font-semibold text-base rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          <span>Proceed to Sign In</span>
          <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">arrow_forward</span>
        </Link>
      </div>
    );
  }

  if (status === 'incomplete') {
    return (
      <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
          <span className="material-symbols-outlined text-3xl" aria-hidden="true">warning</span>
        </div>
        <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">
          Verification Incomplete
        </h2>
        <p className="text-sm text-brand-textSecondary leading-relaxed max-w-sm mx-auto mb-4">{errorMessage}</p>

        <div className="mb-6 text-left">
          <FeedbackAlert tone="warning">
            Firebase accepted the email link, but TripMate has not confirmed the account yet.
          </FeedbackAlert>
        </div>

        <Link
          href={ROUTES.signIn}
          className="w-full h-12 bg-brand-teal hover:bg-brand-brightTeal active:scale-[0.98] text-white font-semibold text-base rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          <span>Proceed to Sign In</span>
          <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">arrow_forward</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shadow-sm">
        <span className="material-symbols-outlined text-3xl">error</span>
      </div>
      <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">
        Verification Failed
      </h2>
      <p className="text-sm text-brand-textSecondary leading-relaxed max-w-sm mx-auto mb-4">
        {errorMessage || 'The verification link is invalid, expired, or has already been used.'}
      </p>

      <div className="mb-6 text-left">
        <FeedbackAlert tone="error">
          Please request a new verification email from the verification screen or proceed to sign in if you already verified your account.
        </FeedbackAlert>
      </div>

      <div className="space-y-3">
        <Link
          href={ROUTES.signIn}
          className="w-full h-12 bg-brand-teal hover:bg-brand-brightTeal active:scale-[0.98] text-white font-semibold text-base rounded-xl shadow-btn transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          <span>Back to Sign In</span>
          <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">arrow_forward</span>
        </Link>
        <Link
          href={ROUTES.register}
          className="w-full h-12 bg-white hover:bg-slate-50 active:scale-[0.98] border border-[#CBD5E1] rounded-xl text-[#1E293B] font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
        >
          Back to Registration
        </Link>
      </div>
    </div>
  );
}
