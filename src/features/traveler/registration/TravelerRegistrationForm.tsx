'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { CheckboxField, PasswordField, TextField } from '@/components/ui/FormControls';
import { simulateMockRequest } from '@/data/batchOneMock';
import { ROUTES } from '@/lib/routes';

type Errors = Partial<Record<'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'terms', string>>;

export function TravelerRegistrationForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [feedback, setFeedback] = useState<{ tone: 'info' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (!fullName.trim()) nextErrors.fullName = 'This field is required.';
    if (!email.trim()) nextErrors.email = 'This field is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Invalid email format. Please enter a valid email address (e.g., user@example.com).';
    if (phone && !/^0\d{9}$/.test(phone)) nextErrors.phone = 'Invalid phone number. Phone number must be 10 digits starting with 0.';
    if (!password) nextErrors.password = 'This field is required.';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) nextErrors.password = 'Password must be at least 8 characters, containing uppercase, lowercase, number, and special character.';
    if (!confirmPassword) nextErrors.confirmPassword = 'This field is required.';
    else if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match. Please re-enter.';
    if (!terms) nextErrors.terms = 'This field is required.';

    setErrors(nextErrors);
    setFeedback(null);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    await simulateMockRequest();
    setLoading(false);

    if (email.toLowerCase() === 'existing@tripmate.test') {
      setFeedback({ tone: 'error', message: 'An account with this email already exists. Please sign in or use another email.' });
      return;
    }
    if (email.toLowerCase() === 'system@tripmate.test') {
      setFeedback({ tone: 'error', message: 'TripMate is temporarily unable to process your request. Please check your connection and try again.' });
      return;
    }
    setRegistered(true);
  }

  async function handleGoogle() {
    setLoading(true);
    setFeedback(null);
    await simulateMockRequest();
    setLoading(false);
    setFeedback({ tone: 'info', message: 'Google authorization is an external handoff and is not connected in this local UI prototype.' });
  }

  if (registered) {
    return (
      <div className="space-y-5">
        <FeedbackAlert tone="success" title="Registration submitted">
          Account registered successfully! Please verify your email/OTP to activate your account.
        </FeedbackAlert>
        <p className="text-sm leading-relaxed text-[#59616b]">The standard registration path continues to Verify Account. Protected functions remain unavailable until verification succeeds.</p>
        <Link href={`${ROUTES.verifyAccount}?email=${encodeURIComponent(email)}`} className="flex min-h-11 items-center justify-center rounded-xl bg-[#007d6e] px-5 py-3 text-sm font-bold text-white hover:bg-[#006b5f]">Continue to Verify Account</Link>
        <ActionButton type="button" variant="outline" className="w-full" onClick={() => setRegistered(false)}>Back to form</ActionButton>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b5f]">Traveler account</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#00152a]">Create your TripMate account</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#59616b]">Standard registration requires account verification before protected functions become available.</p>
      </div>
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <TextField label="Full Name" name="fullName" autoComplete="name" value={fullName} disabled={loading} error={errors.fullName} onChange={(event) => setFullName(event.target.value)} />
        <TextField label="Email Address" name="email" type="email" autoComplete="email" value={email} disabled={loading} error={errors.email} onChange={(event) => setEmail(event.target.value)} />
        <TextField label="Phone Number" name="phone" type="tel" autoComplete="tel" optional value={phone} disabled={loading} error={errors.phone} onChange={(event) => setPhone(event.target.value)} />
        <PasswordField label="Password" name="password" autoComplete="new-password" value={password} disabled={loading} error={errors.password} help="At least 8 characters with uppercase, lowercase, number, and special character." onChange={(event) => setPassword(event.target.value)} />
        <PasswordField label="Confirm Password" name="confirmPassword" autoComplete="new-password" value={confirmPassword} disabled={loading} error={errors.confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        <CheckboxField name="terms" checked={terms} disabled={loading} error={errors.terms} onChange={(event) => setTerms(event.target.checked)}>
          I accept the <a href="#terms" className="font-bold text-[#006b5f] underline">Terms of Service</a> and <a href="#privacy" className="font-bold text-[#006b5f] underline">Privacy Policy</a>.
        </CheckboxField>
        <ActionButton type="submit" variant="secondary" loading={loading} className="w-full">Register</ActionButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-[#74777e]" aria-hidden="true"><span className="h-px flex-1 bg-[#d8dadd]" /> or continue with <span className="h-px flex-1 bg-[#d8dadd]" /></div>
      <ActionButton type="button" variant="outline" loading={loading} className="w-full" onClick={handleGoogle}><span className="font-extrabold text-[#4285f4]" aria-hidden="true">G</span>Continue with Google</ActionButton>
      {feedback ? <div className="mt-5"><FeedbackAlert tone={feedback.tone}>{feedback.message}</FeedbackAlert></div> : null}
      <Link href={ROUTES.signIn} className="mt-6 flex justify-center text-sm font-bold text-[#006b5f] hover:underline">Back to Sign In</Link>
      <p className="mt-5 rounded-lg bg-[#f2f4f7] px-3 py-2 text-center text-[11px] leading-relaxed text-[#59616b]">Interactive prototype: registration is simulated locally and no account data is stored.</p>
    </div>
  );
}
