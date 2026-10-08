'use client';

import { useEffect, useState } from 'react';
import { applyActionCode, checkActionCode } from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase';
import { mapFirebaseAuthError } from '@/lib/authErrorMapper';

type Props = { mode?: string; oobCode?: string };

export function OperatorMobileVerifyEmailHandler({ mode, oobCode }: Props) {
  const hasActionCode = mode === 'verifyEmail' && Boolean(oobCode);
  const [status, setStatus] = useState<'verifying' | 'returnToApp' | 'error'>(
    hasActionCode ? 'verifying' : 'returnToApp',
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!hasActionCode || !oobCode) return;
    let mounted = true;

    async function verify() {
      try {
        const auth = getFirebaseAuth();
        await checkActionCode(auth, oobCode as string);
        await applyActionCode(auth, oobCode as string);
        if (mounted) setStatus('returnToApp');
      } catch (error: unknown) {
        if (!mounted) return;
        setErrorMessage(mapFirebaseAuthError(
          error,
          'The verification link is invalid, expired, or has already been used.',
        ));
        setStatus('error');
      }
    }

    void verify();
    return () => { mounted = false; };
  }, [hasActionCode, oobCode]);

  return (
    <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100 text-center">
      {status === 'verifying' ? (
        <>
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
          <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">Verifying Email...</h2>
          <p className="text-sm text-brand-textSecondary">Please wait while we check your verification link.</p>
        </>
      ) : status === 'error' ? (
        <>
          <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">Verification Failed</h2>
          <p className="text-sm text-brand-textSecondary">{errorMessage}</p>
          <p className="mt-4 text-sm text-brand-textSecondary">Return to the TripMate app to request another email.</p>
        </>
      ) : (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lightTeal text-brand-teal border border-brand-teal/20">
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">mark_email_read</span>
          </div>
          <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">Return to the TripMate app</h2>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            Open the app and select “I verified my email — submit application”. The app will check your Firebase email status before sending the Tour Operator application.
          </p>
        </>
      )}
    </div>
  );
}
