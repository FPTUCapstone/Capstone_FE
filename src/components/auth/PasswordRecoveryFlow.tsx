'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PasswordField, TextField } from '@/components/ui/FormControls';
import {
  confirmWebPasswordReset,
  requestWebPasswordReset,
} from '@/features/auth/recovery/webRecovery';
import { mapPasswordResetError } from '@/lib/authErrorMapper';
import { useVerificationEmailCooldown } from '@/lib/useVerificationEmailCooldown';
import { validatePassword } from '@/lib/passwordPolicy';
import { ROUTES } from '@/lib/routes';

type RecoveryStep = 'request' | 'reset' | 'success';

type PasswordRecoveryFlowProps = {
  admin?: boolean;
};

type Feedback = {
  message: string;
  tone: 'info' | 'success' | 'error';
} | null;

type FieldErrors = Partial<Record<'email' | 'code' | 'password' | 'confirmPassword', string>>;

const steps: { id: RecoveryStep; label: string }[] = [
  { id: 'request', label: 'Request' },
  { id: 'reset', label: 'New Password' },
  { id: 'success', label: 'Success' },
];

// The Backend owns the OTP TTL; this copy is informational only.
const OTP_TTL_NOTICE = 'The code is single-use and expires in 3 minutes.';
const emailRequiredMessage = 'Please enter your email.';
const invalidEmailMessage = 'Invalid email format. Please enter a valid email address.';
const codeRequiredMessage = 'Please enter the 6-digit code.';
const codeFormatMessage = 'The reset code must be exactly 6 digits.';
const confirmRequiredMessage = 'Please confirm your password.';
const confirmMismatchMessage = 'Passwords do not match. Please re-enter.';

// The OTP is a 6-ASCII-digit string; the leading zero must survive to the
// Backend, so the value is never coerced through Number()/parseInt().
const RESET_CODE_RE = /^[0-9]{6}$/;

// Backend rule: a new OTP may be requested 60 seconds after the previous one.
const RESEND_COOLDOWN_SECONDS = 60;

export function PasswordRecoveryFlow({ admin = false }: PasswordRecoveryFlowProps) {
  const [step, setStep] = useState<RecoveryStep>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(false);
  const resendInFlightRef = useRef(false);
  const { secondsLeft: resendSecondsLeft, isOnCooldown: resendOnCooldown, startCooldown: startResendCooldown } = useVerificationEmailCooldown(RESEND_COOLDOWN_SECONDS);
  const signInRoute = admin ? ROUTES.admin.login : ROUTES.signIn;
  const backLinkClass = admin
    ? 'flex min-h-11 items-center justify-center rounded-xl border border-[#9aa1aa] px-5 py-3 text-sm font-bold text-[#00152a] hover:bg-[#f2f4f7]'
    : 'flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]';
  const currentIndex = steps.findIndex((item) => item.id === step);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const trimmedEmail = email.trim();
    const nextErrors: FieldErrors = {};
    if (!trimmedEmail) nextErrors.email = emailRequiredMessage;
    else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) nextErrors.email = invalidEmailMessage;

    setErrors(nextErrors);
    setFeedback(null);
    if (nextErrors.email) return;

    setLoading(true);
    try {
      // The Backend answers enumeration-safely; this UX is deliberately
      // identical whether or not the account exists.
      await requestWebPasswordReset(trimmedEmail.toLowerCase());
      // A successful request starts the 60-second resend window; the Backend
      // alone decides when a new OTP may actually be issued.
      startResendCooldown();
      setStep('reset');
      setFeedback({
        tone: 'info',
        message: `If an account exists for this email, a 6-digit reset code has been sent. ${OTP_TTL_NOTICE}`,
      });
    } catch (error: unknown) {
      setFeedback({ tone: 'error', message: mapPasswordResetError(error) });
    } finally {
      setLoading(false);
    }
  }

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const nextErrors: FieldErrors = {};

    if (!code) nextErrors.code = codeRequiredMessage;
    else if (!RESET_CODE_RE.test(code)) nextErrors.code = codeFormatMessage;

    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;

    if (!confirmPassword) nextErrors.confirmPassword = confirmRequiredMessage;
    else if (confirmPassword !== password) nextErrors.confirmPassword = confirmMismatchMessage;

    setErrors(nextErrors);
    setFeedback(null);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await confirmWebPasswordReset({ email: email.trim().toLowerCase(), code, newPassword: password });
      // Recovery state is dead the moment the reset succeeds; nothing about it
      // may authenticate the user or survive into the next screen.
      setCode('');
      setPassword('');
      setConfirmPassword('');
      setFeedback({
        tone: 'success',
        message: 'Your password has been reset successfully. Please sign in with your new password.',
      });
      setStep('success');
    } catch (error: unknown) {
      // Invalid/expired codes (MSG14) keep the user here with values intact so
      // they can retry or request a new code; the Backend owns attempt counts.
      setFeedback({ tone: 'error', message: mapPasswordResetError(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendOnCooldown || loading || resendInFlightRef.current) return;
    // The ref guards against double clicks inside one render batch, where the
    // loading state has not re-rendered yet.
    resendInFlightRef.current = true;
    setFeedback(null);
    setLoading(true);
    try {
      await requestWebPasswordReset(email.trim().toLowerCase());
      startResendCooldown();
      setFeedback({
        tone: 'info',
        message: `A new reset code has been sent to your email. Any previous code is no longer valid. ${OTP_TTL_NOTICE}`,
      });
    } catch (error: unknown) {
      // A Backend rate limit keeps the local cooldown running so the user
      // cannot spam the endpoint; no automatic retry is attempted.
      if ((error as { status?: number } | null)?.status === 429) startResendCooldown();
      setFeedback({ tone: 'error', message: mapPasswordResetError(error) });
    } finally {
      resendInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div>
      {!admin ? (
        <div className="mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-teal">Progressive recovery</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-navy">Password Recovery</h2>
        </div>
      ) : null}

      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Password recovery progress">
        {steps.map((item, index) => (
          <li key={item.id} className="min-w-0">
            <span className={`block h-1.5 rounded-full transition-colors ${index <= currentIndex ? 'bg-brand-brightTeal' : 'bg-slate-200'}`} />
            <span className={`mt-2 hidden text-[10px] font-bold uppercase tracking-wide sm:block ${index === currentIndex ? 'text-brand-teal' : 'text-brand-textSecondary'}`}>
              {item.label}
            </span>
          </li>
        ))}
      </ol>

      {step === 'request' ? (
        <form className="space-y-5" noValidate onSubmit={submitRequest}>
          <div>
            <h3 className="text-xl font-extrabold text-brand-navy">{admin ? 'Recover administrator access' : 'Reset your password'}</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-textSecondary">
              Enter the {admin ? 'Administrator ' : ''}Email Address associated with the account. The response does not disclose whether an account exists.
            </p>
          </div>
          <TextField
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={admin ? 'admin@tripmate.com' : 'name@example.com'}
            value={email}
            disabled={loading}
            error={errors.email}
            onChange={(event) => setEmail(event.target.value)}
            leading={!admin ? <span className="material-symbols-outlined text-[20px]" aria-hidden="true">mail</span> : undefined}
          />
          <ActionButton type="submit" variant={admin ? 'primary' : 'teal'} loading={loading} className="group w-full">
            <span>Send Reset Code</span>
            {!admin ? <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true">arrow_forward</span> : null}
          </ActionButton>
          {feedback ? <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert> : null}
          <Link href={signInRoute} className={backLinkClass}>
            {!admin ? <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span> : null}
            Back to {admin ? 'Admin Login' : 'Sign In'}
          </Link>
        </form>
      ) : null}

      {step === 'reset' ? (
        <form className="space-y-5" noValidate onSubmit={submitReset}>
          <div>
            <h3 className="text-xl font-extrabold text-brand-navy">Set a new password</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-textSecondary">
              Enter the 6-digit code sent to <span className="break-all font-semibold text-brand-navy">{email.trim().toLowerCase()}</span>, then choose a new password. {OTP_TTL_NOTICE}
            </p>
          </div>
          <TextField
            label="Reset Code"
            name="resetCode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="Enter the 6-digit code"
            value={code}
            disabled={loading}
            error={errors.code}
            onChange={(event) => setCode(event.target.value)}
            leading={!admin ? <span className="material-symbols-outlined text-[20px]" aria-hidden="true">pin</span> : undefined}
          />
          <PasswordField
            label="New Password"
            name="newPassword"
            autoComplete="new-password"
            value={password}
            disabled={loading}
            help="At least 8 characters with uppercase, lowercase, number, and special character."
            error={errors.password}
            onChange={(event) => setPassword(event.target.value)}
            leading={!admin ? <span className="material-symbols-outlined text-[20px]" aria-hidden="true">lock</span> : undefined}
          />
          <PasswordField
            label="Confirm New Password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            disabled={loading}
            error={errors.confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            leading={!admin ? <span className="material-symbols-outlined text-[20px]" aria-hidden="true">lock_reset</span> : undefined}
          />
          {feedback ? <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert> : null}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <ActionButton className="min-w-0 w-full" type="submit" variant={admin ? 'primary' : 'teal'} loading={loading}>Reset Password</ActionButton>
            <ActionButton
              className="min-w-0 w-full"
              type="button"
              variant="outline"
              loading={loading}
              disabled={resendOnCooldown || loading}
              onClick={handleResendCode}
            >
              <span className="whitespace-nowrap text-xs tabular-nums">
                {resendOnCooldown ? `Resend Code (${resendSecondsLeft}s)` : 'Resend Code'}
              </span>
            </ActionButton>
          </div>
          <Link href={signInRoute} className={backLinkClass}>
            {!admin ? <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span> : null}
            Back to {admin ? 'Admin Login' : 'Sign In'}
          </Link>
        </form>
      ) : null}

      {step === 'success' ? (
        <div className={`space-y-5 ${admin ? '' : 'text-center'}`}>
          {!admin ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-lightTeal text-brand-teal">
              <span className="material-symbols-outlined text-[36px]" aria-hidden="true">check_circle</span>
            </div>
          ) : null}
          <FeedbackAlert tone="success" title="Password reset successful">
            Your password has been reset successfully. Please sign in with your new password.
          </FeedbackAlert>
          <p className="text-sm leading-relaxed text-brand-textSecondary">For your security, sign in with your new password the next time you access TripMate.</p>
          <Link href={signInRoute} className={admin
            ? 'flex min-h-11 items-center justify-center rounded-xl bg-[#00152a] px-5 py-3 text-sm font-bold text-white hover:bg-[#102a43]'
            : 'group flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-teal px-5 py-3 text-sm font-bold text-white shadow-btn transition hover:bg-brand-brightTeal active:scale-[0.98]'}>
            {admin ? 'Return to Admin Login' : 'Sign In'}
            {!admin ? <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true">arrow_forward</span> : null}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
