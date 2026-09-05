'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField } from '@/components/ui/FormControls';
import { simulateMockRequest } from '@/data/batchOneMock';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};

    if (!email.trim()) nextErrors.email = requiredMessage;
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = invalidEmailMessage;
    if (!password) nextErrors.password = requiredMessage;

    setErrors(nextErrors);
    setFeedback(null);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    await simulateMockRequest();
    setLoading(false);

    if (email.toLowerCase() === 'system@tripmate.test') {
      setFeedback({
        tone: 'error',
        message: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
      });
      return;
    }

    if (email.toLowerCase() === 'locked@tripmate.test') {
      setFeedback({
        tone: 'error',
        message: 'Your account has been locked due to policy violations. Please contact support@tripmate.com.',
      });
      return;
    }

    if (password === 'incorrect') {
      setFeedback({ tone: 'error', message: 'Incorrect email or password. Please try again.' });
      return;
    }

    setFeedback({
      tone: 'success',
      message: admin
        ? 'Welcome back to TripMate! Signed in successfully. Continue to the Admin prototype workspace below.'
        : 'Welcome back to TripMate! Signed in successfully. Role-based workspace navigation awaits backend integration.',
    });
  }

  async function handleGoogle() {
    setFeedback(null);
    setLoading(true);
    await simulateMockRequest();
    setLoading(false);
    setFeedback({
      tone: 'info',
      message: 'Google authorization is an external handoff and is not connected in this local UI prototype.',
    });
  }

  return (
    <div>
      {!admin ? (
        <div className="mb-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b5f]">Welcome back</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#00152a]">Sign In</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#59616b]">Use the Email Address registered with TripMate.</p>
        </div>
      ) : null}

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
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
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          disabled={loading}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <CheckboxField name="remember" checked={remember} disabled={loading} onChange={(event) => setRemember(event.target.checked)}>
            Remember me
          </CheckboxField>
          <Link href={admin ? ROUTES.admin.forgotPassword : ROUTES.forgotPassword} className="text-sm font-bold text-[#006b5f] hover:underline">
            Forgot Password
          </Link>
        </div>

        <ActionButton type="submit" loading={loading} className="w-full">
          Sign In
        </ActionButton>
      </form>

      {!admin ? (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-[#74777e]" aria-hidden="true">
            <span className="h-px flex-1 bg-[#d8dadd]" /> or continue with <span className="h-px flex-1 bg-[#d8dadd]" />
          </div>
          <ActionButton type="button" variant="outline" loading={loading} className="w-full" onClick={handleGoogle}>
            <span className="text-base font-extrabold text-[#4285f4]" aria-hidden="true">G</span>
            Continue with Google
          </ActionButton>
          <div className="mt-6 space-y-1 text-center text-sm text-[#59616b]">
            <p>
              New Traveler?{' '}
              <Link href={ROUTES.register} className="font-bold text-[#006b5f] hover:underline">Register as Traveler</Link>
            </p>
            <p>
              Travel business?{' '}
              <Link href={ROUTES.partner.register} className="font-bold text-[#006b5f] hover:underline">Register as Tour Operator</Link>
            </p>
          </div>
        </>
      ) : null}

      {feedback ? (
        <div className="mt-6">
          <FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert>
          {feedback.tone === 'success' && admin ? (
            <Link href={ROUTES.admin.dashboard} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white hover:bg-[#006b5f]">
              Open Admin Prototype
            </Link>
          ) : null}
        </div>
      ) : null}

      <p className="mt-6 rounded-lg bg-[#f2f4f7] px-3 py-2 text-center text-[11px] leading-relaxed text-[#59616b]">
        Interactive prototype: authentication is simulated locally and no credentials are sent or stored.
      </p>
    </div>
  );
}
