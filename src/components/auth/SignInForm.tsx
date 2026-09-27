'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField } from '@/components/ui/FormControls';
import { type ApiError, webGoogleAuth, isApiError } from '@/lib/authApi';
import { mapGoogleSignInError, mapWebRecoveryError } from '@/lib/authErrorMapper';
import { useVerificationEmailCooldown } from '@/lib/useVerificationEmailCooldown';
import { signInDestination, partnerUnresolvedMessage } from '@/features/auth/routing/signInDestination';
import { ROUTES } from '@/lib/routes';
import { loginWithWebRecovery, resendWebVerification } from '@/features/auth/recovery/webRecovery';
import { GoogleConsentModal } from '@/features/auth/google/GoogleConsentModal';

type SignInFormProps = {
  admin?: boolean;
};

type Feedback = {
  message: string;
  tone: 'info' | 'success' | 'error';
} | null;

const emailRequiredMessage = 'Please enter your email.';
const passwordRequiredMessage = 'Please enter your password.';
const invalidEmailMessage = 'Invalid email format. Please enter a valid email address.';

export function SignInForm({ admin = false }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleConsent, setGoogleConsent] = useState(false);
  const [googlePasswordHint, setGooglePasswordHint] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const { secondsLeft: resendSecondsLeft, isOnCooldown: resendOnCooldown, startCooldown: startResendCooldown } = useVerificationEmailCooldown(60);

  async function handleResendEmail() {
    if (resendOnCooldown || loading) return;
    setFeedback(null);
    setLoading(true);

    try {
      if (!unverifiedEmail || email.trim().toLowerCase() !== unverifiedEmail.trim().toLowerCase()) throw { code: 'FIREBASE_SESSION_MISMATCH' };
      await resendWebVerification(unverifiedEmail, password);
      startResendCooldown();
      setFeedback({ tone: 'success', message: 'A fresh verification link has been sent to your email. Please check your inbox.' });
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      if (code === 'MSG_COOLDOWN' || (error && typeof error === 'object' && 'status' in error && error.status === 429)) {
        startResendCooldown();
      }
      setFeedback({ tone: 'error', message: mapWebRecoveryError(error) });
    } finally { setLoading(false); }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const nextErrors: typeof errors = {};

    if (!email.trim()) nextErrors.email = emailRequiredMessage;
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = invalidEmailMessage;
    if (!password) nextErrors.password = passwordRequiredMessage;

    setErrors(nextErrors);
    setFeedback(null);
    setUnverifiedEmail(null);
    setGooglePasswordHint(false);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      const res = await loginWithWebRecovery({ email: email.trim().toLowerCase(), password, keepMeSignedIn: remember }, admin);

      setFeedback({
        tone: 'success',
        message: signInDestination(res) ? 'Signed in successfully! Redirecting...' : partnerUnresolvedMessage,
      });

      const destination = signInDestination(res);
      if (destination) router.push(destination);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.code === 'MSG_UNVERIFIED' || apiErr?.code === 'MSG_EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email.trim());
        setFeedback({
          tone: 'error',
          message: mapWebRecoveryError(apiErr),
        });
      } else {
        if (isApiError(err) && err.errors) {
          setErrors({
            email: err.errors.email === 'MSG01' ? emailRequiredMessage : err.errors.email === 'MSG02' ? invalidEmailMessage : undefined,
            password: err.errors.password === 'MSG01' ? passwordRequiredMessage : undefined,
          });
        }
        setFeedback({ tone: 'error', message: mapWebRecoveryError(err) });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (admin || loading || !googleConsent) return;
    setGoogleConsent(false);
    setUnverifiedEmail(null);
    setGooglePasswordHint(false);
    setFeedback(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(getFirebaseAuth(), provider);
      const idToken = await result.user.getIdToken();

      const res = await webGoogleAuth(idToken, remember);
      const destination = signInDestination(res);
      setFeedback({ tone: 'success', message: destination ? 'Signed in with Google successfully! Redirecting...' : partnerUnresolvedMessage });
      if (destination) router.push(destination);

    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        ((err as { code: string }).code === 'auth/popup-closed-by-user' ||
          (err as { code: string }).code === 'auth/cancelled-popup-request')
      ) {
        // User closed the Google popup intentionally; clear feedback without showing raw error
        setFeedback(null);
        return;
      }
      const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined;
      setGooglePasswordHint(code === 'auth.admin_google_sign_in_disabled' || code === 'MSG_UNVERIFIED');
      setFeedback({ tone: 'error', message: mapGoogleSignInError(err) });
    } finally {
      setLoading(false);
    }
  }

  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');

  return (
    <div>
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[#1D4ED8] text-white text-2xl shadow-xs">
          ⛰
        </div>
        <h2 className="text-[21px] font-bold tracking-tight text-[#0F1B2D]">Welcome back</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-[#6B7C97]">Sign in to continue planning your trip.</p>
      </div>

      <div className="segs mb-4">
        <button
          type="button"
          className={loginMethod === 'email' ? 'active' : ''}
          onClick={() => setLoginMethod('email')}
        >
          Email
        </button>
        <button
          type="button"
          className={loginMethod === 'otp' ? 'active' : ''}
          onClick={() => setLoginMethod('otp')}
        >
          Phone / OTP
        </button>
      </div>

      {loginMethod === 'otp' ? (
        <div className="rounded-xl border border-[#E1E8F3] bg-[#F4F7FC] p-4 text-center text-xs text-[#6B7C97] mb-4">
          Phone / OTP sign-in is available in the TripMate Mobile app. Please sign in with your email or Google account on Web.
        </div>
      ) : null}

      <form className="space-y-3.5" noValidate onSubmit={handleSubmit}>
        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={admin ? 'admin@tripmate.com' : 'phuc.nguyen@gmail.com'}
          value={email}
          disabled={loading}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          disabled={loading}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px]">
          <CheckboxField name="remember" checked={remember} disabled={loading} onChange={(event) => setRemember(event.target.checked)}>
            Keep me signed in
          </CheckboxField>
          <Link href={admin ? ROUTES.admin.forgotPassword : ROUTES.forgotPassword} className="font-semibold text-[#1D4ED8] hover:underline">
            Forgot password?
          </Link>
        </div>

        <ActionButton type="submit" variant="primary" loading={loading} className="w-full mt-2">
          Sign in
        </ActionButton>
      </form>

      {!admin ? (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-[#6B7C97]" aria-hidden="true">
            <span className="h-px flex-1 bg-[#E1E8F3]" /> or continue with <span className="h-px flex-1 bg-[#E1E8F3]" />
          </div>
          <ActionButton type="button" variant="outline" loading={loading} className="w-full font-semibold" onClick={() => { if (!loading) setGoogleConsent(true); }}>
            <span className="text-base font-bold text-[#4285f4]" aria-hidden="true">G</span>
            Continue with Google
          </ActionButton>
          <div className="mt-5 text-center text-xs text-[#6B7C97]">
            New to TripMate?{' '}
            <Link href={ROUTES.register} className="font-semibold text-[#1D4ED8] hover:underline">Create an account</Link>
          </div>
        </>
      ) : null}

      {googleConsent && !admin ? <GoogleConsentModal onCancel={() => setGoogleConsent(false)} onAgree={handleGoogle} /> : null}
      {feedback ? (
        <div className="mt-4 space-y-3">
          <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
          {admin && feedback.tone === 'error' ? (
            <Link href={ROUTES.signIn} className="font-semibold text-[#1D4ED8] hover:underline">Go to public sign-in</Link>
          ) : null}
          {googlePasswordHint ? <Link href={ROUTES.signIn} className="font-semibold text-[#1D4ED8] hover:underline">Sign in with email and password</Link> : null}
          {unverifiedEmail ? (
            <div className="flex flex-col gap-2 rounded-xl border border-[#E1E8F3] bg-[#F4F7FC] p-3 text-xs text-[#6B7C97]">
              <p>
                Haven&apos;t received the verification email yet? Check your spam folder or resend below.
              </p>
              <ActionButton
                type="button"
                variant="outline"
                loading={loading}
                disabled={resendOnCooldown || loading}
                className="w-full text-xs"
                onClick={handleResendEmail}
              >
                {resendOnCooldown ? `Resend Email (${resendSecondsLeft}s)` : 'Resend Verification Email'}
              </ActionButton>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
