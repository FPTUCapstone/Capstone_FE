'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField } from '@/components/ui/FormControls';
import { type ApiError, googleAuth, login, saveTokens, verifyEmail } from '@/lib/authApi';
import { isTooManyRequestsError, mapAuthError } from '@/lib/authErrorMapper';
import { useVerificationEmailCooldown } from '@/lib/useVerificationEmailCooldown';
import { ROUTES } from '@/lib/routes';

type SignInFormProps = {
  admin?: boolean;
};

type Feedback = {
  message: string;
  tone: 'info' | 'success' | 'error';
} | null;

const requiredMessage = 'This field is required.';
const invalidEmailMessage = 'Invalid email format. Please enter a valid email address (e.g., user@example.com).';

export function SignInForm({ admin = false }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      let user = auth.currentUser;
      if (!user && unverifiedEmail && password) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, unverifiedEmail, password);
          user = userCred.user;
        } catch (authErr: unknown) {
          if (isTooManyRequestsError(authErr)) {
            startResendCooldown();
            setFeedback({
              tone: 'error',
              message: 'Too many resend attempts. Please wait a few minutes before trying again.',
            });
            return;
          }
        }
      }

      if (!user) {
        setFeedback({
          tone: 'error',
          message: 'Unable to resend email. Please verify your password and try again.',
        });
        return;
      }

      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      });

      startResendCooldown();
      setFeedback({
        tone: 'success',
        message: 'A fresh verification link has been sent to your email. Please check your inbox.',
      });
    } catch (err: unknown) {
      if (isTooManyRequestsError(err)) {
        startResendCooldown();
        setFeedback({
          tone: 'error',
          message: 'Too many resend attempts. Please wait a few minutes before trying again.',
        });
        return;
      }
      const msg =
        err instanceof Error && !err.message.includes('auth/')
          ? err.message
          : 'Unable to send verification email. Please try again later.';
      setFeedback({ tone: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};

    if (!email.trim()) nextErrors.email = requiredMessage;
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = invalidEmailMessage;
    if (!password) nextErrors.password = requiredMessage;

    setErrors(nextErrors);
    setFeedback(null);
    setUnverifiedEmail(null);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    // Admin prototype simulation fallback
    if (admin) {
      setLoading(false);
      setFeedback({
        tone: 'success',
        message: 'Welcome back to TripMate! Signed in successfully. Continue to the Admin prototype workspace below.',
      });
      return;
    }

    try {
      const res = await login({ email: email.trim(), password });
      saveTokens(res.accessToken, res.refreshToken, {
        email: res.email,
        fullName: res.fullName,
      });

      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch {
        // Ignored if Firebase auth sync fails; REST tokens are preserved in localStorage
      }

      setFeedback({
        tone: 'success',
        message: 'Signed in successfully! Redirecting...',
      });

      router.push(ROUTES.home);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.code === 'MSG_UNVERIFIED' || apiErr?.message?.includes('verified') || apiErr?.message?.includes('verification')) {
        // Check if user has verified their email in Firebase Auth
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          await userCredential.user.reload();
          if (userCredential.user.emailVerified) {
            const idToken = await userCredential.user.getIdToken();
            const verifyRes = await verifyEmail(idToken);
            saveTokens(verifyRes.accessToken, verifyRes.refreshToken, {
              email: userCredential.user.email || email.trim(),
              fullName: userCredential.user.displayName || userCredential.user.email || email.trim(),
            });
            setFeedback({
              tone: 'success',
              message: 'Signed in successfully! Redirecting...',
            });
            router.push(ROUTES.home);
            return;
          }
        } catch {
          // Firebase signin failed or user genuinely not verified
        }

        setUnverifiedEmail(email.trim());
        setFeedback({
          tone: 'error',
          message: 'Your email address has not been verified yet. Please verify your email before signing in.',
        });
      } else if (apiErr?.code === 'auth.invalid_credentials' || apiErr?.status === 401 || apiErr?.status === 400) {
        setFeedback({ tone: 'error', message: apiErr?.message || 'Invalid email or password.' });
      } else {
        setFeedback({ tone: 'error', message: mapAuthError(apiErr?.code, apiErr?.message) });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setFeedback(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await googleAuth(idToken);
      saveTokens(res.accessToken, res.refreshToken, {
        email: result.user.email || '',
        fullName: result.user.displayName || result.user.email || '',
      });

      setFeedback({
        tone: 'success',
        message: 'Signed in with Google successfully! Redirecting...',
      });

      router.push(ROUTES.home);
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
      const errorMsg =
        err instanceof Error ? err.message : 'Google authentication failed. Please try again.';
      setFeedback({ tone: 'error', message: errorMsg });
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
          <ActionButton type="button" variant="outline" loading={loading} className="w-full font-semibold" onClick={handleGoogle}>
            <span className="text-base font-bold text-[#4285f4]" aria-hidden="true">G</span>
            Continue with Google
          </ActionButton>
          <div className="mt-5 text-center text-xs text-[#6B7C97]">
            New to TripMate?{' '}
            <Link href={ROUTES.register} className="font-semibold text-[#1D4ED8] hover:underline">Create an account</Link>
          </div>
        </>
      ) : null}

      {feedback ? (
        <div className="mt-4 space-y-3">
          <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
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
          {feedback.tone === 'success' && admin ? (
            <Link href={ROUTES.admin.dashboard} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1D4ED8] px-5 py-3 text-sm font-bold text-white hover:bg-[#2563EB]">
              Open Admin Prototype
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
