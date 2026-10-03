'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField } from '@/components/ui/FormControls';
import { ROUTES } from '@/lib/routes';
import { GoogleConsentModal } from '@/features/auth/google/GoogleConsentModal';
import { useSignInEngine } from '@/features/auth/sign-in/useSignInEngine';

type SignInFormProps = {
  admin?: boolean;
};

export function SignInForm({ admin = false }: SignInFormProps) {
  const {
    email,
    password,
    remember,
    errors,
    feedback,
    loading,
    googleConsent,
    googlePasswordHint,
    unverifiedEmail,
    resendSecondsLeft,
    resendOnCooldown,
    setEmail,
    setPassword,
    setRemember,
    setGoogleConsent,
    handleSubmit,
    handleGoogle,
    handleResendEmail,
  } = useSignInEngine({ admin });

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
