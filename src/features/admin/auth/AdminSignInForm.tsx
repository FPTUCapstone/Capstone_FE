'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PasswordField, TextField } from '@/components/ui/FormControls';
import { ROUTES } from '@/lib/routes';

export function AdminSignInForm() {
  const router = useRouter();
  const submitting = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!password.trim()) nextErrors.password = 'This field is required.';
    setErrors(nextErrors);
    setMessage(null);
    if (Object.keys(nextErrors).length) return;

    submitting.current = true;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: AbortSignal.timeout(35000),
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        setMessage(result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
          ? result.message : 'Sign in is temporarily unavailable. Please try again.');
        return;
      }
      setPassword('');
      router.replace(ROUTES.admin.createPoi);
      router.refresh();
    } catch {
      setMessage('Unable to connect. Please check your connection and try again.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <div>
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <TextField label="Email Address" name="email" type="email" autoComplete="email" placeholder="admin@tripmate.com"
          value={email} disabled={loading} error={errors.email} onChange={(event) => setEmail(event.target.value)} />
        <PasswordField label="Password" name="password" autoComplete="current-password" placeholder="Enter your password"
          value={password} disabled={loading} error={errors.password} onChange={(event) => setPassword(event.target.value)} />
        <div className="flex justify-end">
          <Link href={ROUTES.admin.forgotPassword} className="text-sm font-bold text-[#006b5f] hover:underline">Forgot Password</Link>
        </div>
        <ActionButton type="submit" loading={loading} className="w-full">Sign In</ActionButton>
      </form>
      {message ? <div className="mt-6"><FeedbackAlert tone="error">{message}</FeedbackAlert></div> : null}
      <p className="mt-6 rounded-lg bg-[#f2f4f7] px-3 py-2 text-center text-[11px] leading-relaxed text-[#59616b]">
        Sign in with an active Administrator account. You will be asked to sign in again when your session expires.
      </p>
    </div>
  );
}
