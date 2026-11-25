'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { PasswordField, TextField } from '@/components/ui/FormControls';
import {
  confirmWebPasswordReset,
  requestWebPasswordReset,
} from '@/features/auth/recovery/webRecovery';
import { mapPasswordResetError } from '@/lib/authErrorMapper';
import { validatePassword } from '@/lib/passwordPolicy';
import { ROUTES } from '@/lib/routes';
import { useVerificationEmailCooldown } from '@/lib/useVerificationEmailCooldown';

type RecoveryStep = 'request' | 'reset' | 'success';

type PasswordRecoveryFlowProps = {
  admin?: boolean;
};

type Feedback = {
  message: string;
  tone: 'info' | 'success' | 'error';
} | null;

type FieldErrors = Partial<Record<'email' | 'code' | 'password' | 'confirmPassword', string>>;

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
const OTP_LENGTH = 6;
const OTP_SLOTS = [0, 1, 2, 3, 4, 5] as const;

// Backend rule: a new OTP may be requested 60 seconds after the previous one.
const RESEND_COOLDOWN_SECONDS = 60;
const COOLDOWN_STORAGE_KEY = 'tripmate:password-recovery-cooldowns';

type CooldownScope = 'public' | 'admin';

function cooldownKey(scope: CooldownScope, email: string): string {
  return `${scope}:${email}`;
}

function readStoredCooldowns(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const now = Date.now();
    const active: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && value > now) active[key] = value;
    }
    return active;
  } catch {
    return {};
  }
}

function writeStoredCooldowns(map: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(map).length === 0) {
      window.sessionStorage.removeItem(COOLDOWN_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignore storage quota or private-mode access errors.
  }
}

function getStoredCooldownSeconds(scope: CooldownScope, normalizedEmail: string): number {
  if (!normalizedEmail) return 0;
  const map = readStoredCooldowns();
  const expiresAt = map[cooldownKey(scope, normalizedEmail)];
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

function setStoredCooldown(
  scope: CooldownScope,
  normalizedEmail: string,
  seconds = RESEND_COOLDOWN_SECONDS,
): void {
  if (!normalizedEmail || seconds <= 0) return;
  const map = readStoredCooldowns();
  map[cooldownKey(scope, normalizedEmail)] = Date.now() + seconds * 1000;
  writeStoredCooldowns(map);
}

function clearStoredCooldown(scope: CooldownScope, normalizedEmail: string): void {
  if (!normalizedEmail) return;
  const map = readStoredCooldowns();
  delete map[cooldownKey(scope, normalizedEmail)];
  writeStoredCooldowns(map);
}

function evaluatePasswordChecks(password: string) {
  const checks = [
    { id: 'length', label: '8+ characters', met: password.length >= 8 && password.length <= 72 },
    { id: 'case', label: 'Upper & lowercase', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { id: 'digit', label: '1 number', met: /\d/.test(password) },
    { id: 'special', label: '1 special symbol', met: /[^A-Za-z0-9]/.test(password) },
  ] as const;
  const hasWhitespace = /\s/u.test(password);
  const score = checks.filter((item) => item.met).length;
  return { checks, hasWhitespace, score };
}

function NoticeBox({ feedback, title }: { feedback: NonNullable<Feedback>; title?: string }) {
  const tones = {
    info: 'border-[#B2D6C4] bg-[#E8F0EA] text-[#103B39]',
    success: 'border-[#B9E7D4] bg-[#E6F7F0] text-[#085B3E]',
    error: 'border-[#F7C9D3] bg-[#FDECEF] text-[#8C1030]',
  };

  return (
    <div
      className={`rounded-xl border px-3.5 py-2.5 text-[12px] leading-relaxed ${tones[feedback.tone]}`}
      role={feedback.tone === 'error' ? 'alert' : 'status'}
    >
      {title ? <p className="font-bold">{title}</p> : null}
      <p>{feedback.message}</p>
    </div>
  );
}

export function PasswordRecoveryFlow({ admin = false }: PasswordRecoveryFlowProps) {
  const [step, setStep] = useState<RecoveryStep>('request');
  const [email, setEmail] = useState('');
  const [lastRequestedEmail, setLastRequestedEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [otpCaret, setOtpCaret] = useState(0);
  const resendInFlightRef = useRef(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const otpId = useId();
  const otpErrorId = `${otpId}-error`;
  const {
    secondsLeft: resendSecondsLeft,
    isOnCooldown: resendOnCooldown,
    startCooldown: startResendCooldown,
  } = useVerificationEmailCooldown(RESEND_COOLDOWN_SECONDS);

  const steps: { id: RecoveryStep; label: string }[] = [
    { id: 'request', label: 'Request' },
    { id: 'reset', label: 'New Password' },
    { id: 'success', label: 'Done' },
  ];

  const cooldownScope: CooldownScope = admin ? 'admin' : 'public';
  const signInRoute = admin ? ROUTES.admin.login : ROUTES.signIn;
  const backLinkClass =
    'mx-auto flex w-fit items-center justify-center gap-1.5 py-1 text-sm font-medium text-brand-textSecondary transition-colors hover:text-brand-teal';
  const currentIndex = steps.findIndex((item) => item.id === step);

  const stepHeading =
    step === 'request'
      ? admin
        ? 'Recover administrator access'
        : 'Reset your password'
      : step === 'reset'
        ? 'Set a new password'
        : 'Password updated';

  const normalizedEmail = email.trim().toLowerCase();
  const sameEmailOnCooldown = Boolean(
    lastRequestedEmail && normalizedEmail === lastRequestedEmail && resendOnCooldown,
  );
  const codeChars = Array.from(code);
  const activeSlotIndex = Math.min(otpCaret, Math.min(codeChars.length, OTP_LENGTH - 1));
  const passwordEval = evaluatePasswordChecks(password);
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === password && !errors.confirmPassword;

  function handleEmailChange(nextValue: string) {
    setEmail(nextValue);
    const nextNormalized = nextValue.trim().toLowerCase();
    if (!nextNormalized) return;
    const remaining = getStoredCooldownSeconds(cooldownScope, nextNormalized);
    if (remaining > 0 && (lastRequestedEmail !== nextNormalized || !resendOnCooldown)) {
      setLastRequestedEmail(nextNormalized);
      startResendCooldown(remaining);
    }
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || sameEmailOnCooldown) return;
    const trimmedEmail = email.trim();
    const nextErrors: FieldErrors = {};
    if (!trimmedEmail) nextErrors.email = emailRequiredMessage;
    else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) nextErrors.email = invalidEmailMessage;

    setErrors(nextErrors);
    setFeedback(null);
    if (nextErrors.email) return;

    const targetEmail = trimmedEmail.toLowerCase();
    const storedRemaining = getStoredCooldownSeconds(cooldownScope, targetEmail);
    if (storedRemaining > 0) {
      setLastRequestedEmail(targetEmail);
      startResendCooldown(storedRemaining);
      return;
    }

    setLoading(true);
    try {
      // The Backend answers enumeration-safely; this UX is deliberately
      // identical whether or not the account exists.
      await requestWebPasswordReset(targetEmail);
      // Track the last successfully requested email across both "Change email"
      // and "Back to Sign In" so an active cooldown cannot be bypassed.
      setLastRequestedEmail(targetEmail);
      setStoredCooldown(cooldownScope, targetEmail);
      startResendCooldown();
      setStep('reset');
      setFeedback({
        tone: 'info',
        message: `If an account exists for this email, a 6-digit reset code has been sent. ${OTP_TTL_NOTICE}`,
      });
    } catch (error: unknown) {
      if ((error as { status?: number } | null)?.status === 429) {
        setLastRequestedEmail(targetEmail);
        setStoredCooldown(cooldownScope, targetEmail);
        startResendCooldown();
      }
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
      await confirmWebPasswordReset({ email: normalizedEmail, code, newPassword: password });
      // Recovery state is dead the moment the reset succeeds; nothing about it
      // may authenticate the user or survive into the next screen.
      clearStoredCooldown(cooldownScope, normalizedEmail);
      setLastRequestedEmail(null);
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
      await requestWebPasswordReset(normalizedEmail);
      setLastRequestedEmail(normalizedEmail);
      setStoredCooldown(cooldownScope, normalizedEmail);
      startResendCooldown();
      setFeedback({
        tone: 'info',
        message: `If an account exists for this email, check your inbox. Any previous code may no longer be valid. ${OTP_TTL_NOTICE}`,
      });
    } catch (error: unknown) {
      // A Backend rate limit keeps the local cooldown running so the user
      // cannot spam the endpoint; no automatic retry is attempted.
      if ((error as { status?: number } | null)?.status === 429) {
        setStoredCooldown(cooldownScope, normalizedEmail);
        startResendCooldown();
      }
      setFeedback({ tone: 'error', message: mapPasswordResetError(error) });
    } finally {
      resendInFlightRef.current = false;
      setLoading(false);
    }
  }

  function handleChangeEmail() {
    if (loading) return;
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setFeedback(null);
    setStep('request');
  }

  function handleResumeResetStep() {
    if (loading || !lastRequestedEmail) return;
    setEmail(lastRequestedEmail);
    setErrors({});
    setStep('reset');
  }

  const strengthBarColor =
    password.length === 0
      ? 'bg-brand-border'
      : passwordEval.hasWhitespace || passwordEval.score <= 1
        ? 'bg-[#E02D4D]'
        : passwordEval.score < 4
          ? 'bg-[#D97706]'
          : 'bg-[#0E9F6E]';

  return (
    <div>
      {/* Clean Single Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-brand-textPrimary">
          {stepHeading}
        </h2>
        {step === 'request' ? (
          <p className="mt-1.5 text-sm leading-relaxed text-brand-textSecondary">
            {admin
              ? 'Enter your administrator email. The next step is identical whether or not an account exists.'
              : 'Enter your email address. We will send a 6-digit code if an account exists.'}
          </p>
        ) : null}
      </div>

      {/* Slim 3-Step Stepper */}
      <ol className="relative mb-6 grid grid-cols-3 items-start" aria-label="Password recovery progress">
        <div
          className="pointer-events-none absolute top-3 right-[16.666%] left-[16.666%] h-px bg-brand-border"
          aria-hidden="true"
        >
          <div
            className="h-full bg-brand-teal transition-all duration-300"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((item, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li
              key={item.id}
              aria-current={isCurrent ? 'step' : undefined}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                  isCompleted
                    ? 'border-brand-teal bg-brand-teal text-white'
                    : isCurrent
                      ? 'border-brand-navy bg-brand-navy text-white'
                      : 'border-brand-border bg-white text-brand-textSecondary'
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`mt-1.5 text-[11px] font-medium ${
                  isCurrent ? 'text-brand-textPrimary' : 'text-brand-textSecondary'
                }`}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 'request' ? (
        <form className="space-y-4" noValidate onSubmit={submitRequest}>
          <TextField
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={admin ? 'admin@tripmate.com' : 'name@example.com'}
            value={email}
            disabled={loading}
            error={errors.email}
            onChange={(event) => handleEmailChange(event.target.value)}
          />

          <ActionButton
            type="submit"
            variant={admin ? 'forest' : 'teal'}
            loading={loading}
            disabled={sameEmailOnCooldown}
            className="w-full"
          >
            <span className="tabular-nums">
              {sameEmailOnCooldown
                ? `Send Reset Code (${resendSecondsLeft}s)`
                : 'Send Reset Code'}
            </span>
          </ActionButton>

          {sameEmailOnCooldown ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-brand-surface px-3.5 py-2.5 text-xs text-brand-textSecondary">
              <span>A code was recently requested for this email.</span>
              <button
                type="button"
                onClick={handleResumeResetStep}
                className="font-semibold text-brand-teal underline underline-offset-2 hover:text-brand-navy"
              >
                Enter existing code
              </button>
            </div>
          ) : null}

          {feedback ? <NoticeBox feedback={feedback} /> : null}

          <div className="pt-1">
            <Link href={signInRoute} className={backLinkClass}>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_back
              </span>
              <span>{admin ? 'Return to Admin Login' : 'Back to Sign In'}</span>
            </Link>
          </div>
        </form>
      ) : null}

      {step === 'reset' ? (
        <form className="space-y-4" noValidate onSubmit={submitReset}>
          {/* Compact Email Context Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3 text-xs">
            <span className="min-w-0 text-brand-textSecondary">
              Code sent to{' '}
              <span className="break-all font-semibold text-brand-textPrimary">{normalizedEmail}</span>
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={handleChangeEmail}
              className="shrink-0 font-semibold text-brand-teal hover:underline disabled:opacity-50"
            >
              Change email
            </button>
          </div>

          {/* 6-Slot OTP Input (Single Accessible Input Overlay, no decorative icon) */}
          <div>
            <label
              htmlFor={otpId}
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Reset Code
            </label>

            <div className="relative mt-2" onClick={() => otpInputRef.current?.focus()}>
              <input
                ref={otpInputRef}
                id={otpId}
                name="resetCode"
                type="text"
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                autoComplete="one-time-code"
                aria-label="Reset Code"
                aria-describedby={errors.code ? otpErrorId : undefined}
                aria-invalid={Boolean(errors.code)}
                value={code}
                disabled={loading}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setCode(nextValue);
                  setOtpCaret(Math.min(event.target.selectionStart ?? nextValue.length, OTP_LENGTH - 1));
                }}
                onFocus={(event) => {
                  setOtpFocused(true);
                  setOtpCaret(Math.min(event.target.selectionStart ?? code.length, OTP_LENGTH - 1));
                }}
                onBlur={() => setOtpFocused(false)}
                onSelect={(event) => {
                  const target = event.currentTarget;
                  setOtpCaret(Math.min(target.selectionStart ?? code.length, OTP_LENGTH - 1));
                }}
                className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
              />

              <div className="grid grid-cols-6 gap-2" aria-hidden="true">
                {OTP_SLOTS.map((slotIndex) => {
                  const digit = codeChars[slotIndex] ?? '';
                  const isActive = otpFocused && !loading && slotIndex === activeSlotIndex;
                  return (
                    <div
                      key={slotIndex}
                      data-otp-slot={slotIndex}
                      className={`flex h-12 items-center justify-center rounded-xl border font-mono text-lg font-semibold tabular-nums transition-colors ${
                        errors.code
                          ? 'border-red-500 bg-red-50/70 text-red-700'
                          : isActive
                            ? 'border-brand-teal bg-white text-brand-textPrimary ring-2 ring-brand-teal/20'
                            : digit
                              ? 'border-[#174B4A]/40 bg-white text-brand-textPrimary'
                              : 'border-brand-border bg-brand-surface text-slate-400'
                      }`}
                    >
                      {digit ? (
                        digit
                      ) : isActive ? (
                        <span className="h-5 w-px animate-pulse bg-brand-teal" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {errors.code ? (
              <span
                id={otpErrorId}
                role="alert"
                className="mt-1.5 block text-[11px] font-semibold text-red-600"
              >
                {errors.code}
              </span>
            ) : null}
          </div>

          {/* New Password + Clean 4-Rule Checklist (no decorative icons) */}
          <div>
            <PasswordField
              label="New Password"
              name="newPassword"
              autoComplete="new-password"
              value={password}
              disabled={loading}
              error={errors.password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <div className="mt-2 space-y-2" aria-label="Password strength requirements">
              <div className="grid grid-cols-4 gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={`h-1 rounded-full transition-colors ${
                      password.length > 0 && segment < Math.max(1, passwordEval.score)
                        ? strengthBarColor
                        : 'bg-brand-border'
                    }`}
                  />
                ))}
              </div>

              <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                {passwordEval.checks.map((rule) => (
                  <li
                    key={rule.id}
                    className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                      rule.met ? 'font-medium text-[#0E9F6E]' : 'text-brand-textSecondary'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                        rule.met ? 'bg-[#0E9F6E]' : 'bg-brand-border'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>

              {passwordEval.hasWhitespace ? (
                <p className="text-[11px] font-medium text-[#D97706]">No spaces allowed</p>
              ) : null}
            </div>
          </div>

          {/* Confirm New Password (no decorative icon) */}
          <div>
            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              disabled={loading}
              error={errors.confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {passwordsMatch ? (
              <p className="mt-1 text-[11px] font-medium text-[#0E9F6E]">Passwords match</p>
            ) : null}
          </div>

          {feedback ? <NoticeBox feedback={feedback} /> : null}

          <div className="grid gap-3 pt-1 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <ActionButton
              className="min-w-0 w-full"
              type="submit"
              variant={admin ? 'forest' : 'teal'}
              loading={loading}
            >
              Reset Password
            </ActionButton>
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

          <div className="pt-1">
            <Link href={signInRoute} className={backLinkClass}>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_back
              </span>
              <span>Back to {admin ? 'Admin Login' : 'Sign In'}</span>
            </Link>
          </div>
        </form>
      ) : null}

      {step === 'success' ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-lightTeal text-brand-teal">
            <span className="material-symbols-outlined text-[36px]" aria-hidden="true">
              check_circle
            </span>
          </div>

          <div className="text-left">
            <NoticeBox
              feedback={{
                tone: 'success',
                message:
                  'Your password has been reset successfully. Please sign in with your new password.',
              }}
              title="Password reset successful"
            />
          </div>

          <p className="text-sm leading-relaxed text-brand-textSecondary">
            Sign in with your new password to access TripMate.
          </p>

          <Link
            href={signInRoute}
            className={
              admin
                ? 'flex min-h-11 items-center justify-center rounded-xl bg-[#103B39] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174B4A]'
                : 'flex min-h-11 items-center justify-center rounded-xl bg-brand-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-brightTeal'
            }
          >
            {admin ? 'Return to Admin Login' : 'Sign In'}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
