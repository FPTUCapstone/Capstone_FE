'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { applyActionCode } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { ROUTES } from '@/lib/routes';
import { saveTokens, verifyEmail } from '@/lib/authApi';

interface VerifyEmailHandlerProps {
  mode?: string;
  oobCode?: string;
}

export function VerifyEmailHandler({ mode, oobCode }: VerifyEmailHandlerProps) {
  const isInitialValid = mode === 'verifyEmail' && Boolean(oobCode);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
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
        await applyActionCode(auth, oobCode as string);
        if (auth.currentUser) {
          try {
            await auth.currentUser.reload();
            const idToken = await auth.currentUser.getIdToken(true);
            const res = await verifyEmail(idToken);
            saveTokens(res.accessToken, res.refreshToken);
          } catch (syncErr) {
            console.warn('Syncing verifyEmail with BE:', syncErr);
          }
        }
        if (isMounted) {
          setStatus('success');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus('error');
          const errorMsg =
            err instanceof Error
              ? err.message
              : 'The verification link is invalid, expired, or has already been used.';
          setErrorMessage(errorMsg);
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
      <div className="text-center py-10">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#006b5f] border-t-transparent" />
        <h2 className="text-2xl font-extrabold text-[#00152a]">Verifying Email...</h2>
        <p className="mt-2 text-sm text-[#59616b]">
          Please wait while we confirm your email verification link.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7f4] text-[#006b5f]">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#00152a]">
          Email Verified!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#59616b]">
          Your email address has been verified successfully. Please sign in to activate your account and start your journey with TripMate.
        </p>

        <div className="mt-8">
          <Link
            href={ROUTES.signIn}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white hover:bg-[#006b5f] transition"
          >
            Proceed to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#fde8e8] text-[#ba1a1a]">
        <span className="material-symbols-outlined text-4xl">error</span>
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-[#00152a]">
        Verification Failed
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[#59616b]">
        {errorMessage || 'The verification link is invalid, expired, or has already been used.'}
      </p>

      <div className="mt-6">
        <FeedbackAlert tone="error">
          Please request a new verification email from the verification screen or proceed to sign in if you already verified your account.
        </FeedbackAlert>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={ROUTES.signIn}
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white hover:bg-[#006b5f] transition"
        >
          Back to Sign In
        </Link>
        <Link
          href={ROUTES.register}
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[#c3c6ce] px-5 py-3 text-sm font-bold text-[#314863] hover:bg-[#eceef1] transition"
        >
          Back to Registration
        </Link>
      </div>
    </div>
  );
}
