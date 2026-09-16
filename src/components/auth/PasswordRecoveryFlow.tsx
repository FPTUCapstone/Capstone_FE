'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PasswordField, TextField } from '@/components/ui/FormControls';
import { simulateMockRequest } from '@/data/batchOneMock';
import { ROUTES } from '@/lib/routes';

type RecoveryStep = 'request' | 'code' | 'password' | 'success';

type PasswordRecoveryFlowProps = {
  admin?: boolean;
};

const steps: { id: RecoveryStep; label: string }[] = [
  { id: 'request', label: 'Request' },
  { id: 'code', label: 'Reset Code' },
  { id: 'password', label: 'New Password' },
  { id: 'success', label: 'Success' },
];

export function PasswordRecoveryFlow({ admin = false }: PasswordRecoveryFlowProps) {
  const [step, setStep] = useState<RecoveryStep>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const signInRoute = admin ? ROUTES.admin.login : ROUTES.signIn;
  const currentIndex = steps.findIndex((item) => item.id === step);

  async function run(action: () => void) {
    setLoading(true);
    setError('');
    setFeedback('');
    await simulateMockRequest();
    setLoading(false);
    action();
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError('This field is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Invalid email format. Please enter a valid email address (e.g., user@example.com).');
      return;
    }
    void run(() => setStep('code'));
  }

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim()) {
      setError('This field is required.');
      return;
    }
    if (code.trim().toLowerCase() === 'expired') {
      setError('The verification link or code is invalid or expired. Please request a new one.');
      return;
    }
    void run(() => setStep('password'));
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || !confirmPassword) {
      setError('This field is required.');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      setError('Password must be at least 8 characters, containing uppercase, lowercase, number, and special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    void run(() => setStep('success'));
  }

  function resendCode() {
    void run(() => setFeedback('A replacement reset code was requested. Check your Email Address.'));
  }

  return (
    <div>
      {!admin ? (
        <div className="mb-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b5f]">Progressive recovery</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#00152a]">Password Recovery</h2>
        </div>
      ) : null}

      <ol className="mb-7 grid grid-cols-4 gap-2" aria-label="Password recovery progress">
        {steps.map((item, index) => (
          <li key={item.id} className="min-w-0">
            <span className={`block h-1.5 rounded-full ${index <= currentIndex ? 'bg-[#007d6e]' : 'bg-[#d8dadd]'}`} />
            <span className={`mt-2 hidden text-[10px] font-bold uppercase tracking-wide sm:block ${index === currentIndex ? 'text-[#006b5f]' : 'text-[#74777e]'}`}>
              {item.label}
            </span>
          </li>
        ))}
      </ol>

      {step === 'request' ? (
        <form className="space-y-5" noValidate onSubmit={submitRequest}>
          <div>
            <h3 className="text-xl font-extrabold text-[#00152a]">{admin ? 'Recover administrator access' : 'Reset your password'}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#59616b]">
              Enter the {admin ? 'Administrator ' : ''}Email Address associated with the account. The response does not disclose whether an account exists.
            </p>
          </div>
          <TextField label="Email Address" name="email" type="email" autoComplete="email" placeholder={admin ? 'admin@tripmate.com' : 'name@example.com'} value={email} disabled={loading} error={error} onChange={(event) => setEmail(event.target.value)} />
          <ActionButton type="submit" variant={admin ? 'primary' : 'secondary'} loading={loading} className="w-full">Send Reset Code</ActionButton>
          <Link href={signInRoute} className="flex min-h-11 items-center justify-center rounded-xl border border-[#9aa1aa] px-5 py-3 text-sm font-bold text-[#00152a] hover:bg-[#f2f4f7]">Back to {admin ? 'Admin Login' : 'Sign In'}</Link>
        </form>
      ) : null}

      {step === 'code' ? (
        <form className="space-y-5" noValidate onSubmit={submitCode}>
          <div>
            <h3 className="text-xl font-extrabold text-[#00152a]">Enter reset code</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#59616b]">The reset code is single-use and expires 15 minutes after issue.</p>
          </div>
          <TextField label="Reset Code" name="resetCode" autoComplete="one-time-code" placeholder="Enter reset code" value={code} disabled={loading} error={error} onChange={(event) => setCode(event.target.value)} />
          {feedback ? <FeedbackAlert>{feedback}</FeedbackAlert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionButton type="submit" variant={admin ? 'primary' : 'secondary'} loading={loading}>Verify</ActionButton>
            <ActionButton type="button" variant="outline" loading={loading} onClick={resendCode}>Resend Code</ActionButton>
          </div>
        </form>
      ) : null}

      {step === 'password' ? (
        <form className="space-y-5" noValidate onSubmit={submitPassword}>
          <div>
            <h3 className="text-xl font-extrabold text-[#00152a]">Set a new password</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#59616b]">Create a password that meets the TripMate password policy.</p>
          </div>
          <PasswordField label="New Password" name="newPassword" autoComplete="new-password" value={password} disabled={loading} help="At least 8 characters with uppercase, lowercase, number, and special character." onChange={(event) => setPassword(event.target.value)} />
          <PasswordField label="Confirm New Password" name="confirmPassword" autoComplete="new-password" value={confirmPassword} disabled={loading} error={error} onChange={(event) => setConfirmPassword(event.target.value)} />
          <ActionButton type="submit" variant={admin ? 'primary' : 'secondary'} loading={loading} className="w-full">Reset Password</ActionButton>
        </form>
      ) : null}

      {step === 'success' ? (
        <div className="space-y-5">
          <FeedbackAlert tone="success" title="Password reset successful">
            Your password has been reset successfully. Please sign in with your new password.
          </FeedbackAlert>
          <p className="text-sm leading-relaxed text-[#59616b]">Existing {admin ? 'Administrator ' : ''}sessions are invalidated and a new sign-in is required.</p>
          <Link href={signInRoute} className={`flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white ${admin ? 'bg-[#00152a] hover:bg-[#102a43]' : 'bg-[#007d6e] hover:bg-[#006b5f]'}`}>
            {admin ? 'Return to Admin Login' : 'Sign In'}
          </Link>
        </div>
      ) : null}

      <p className="mt-7 rounded-lg bg-[#f2f4f7] px-3 py-2 text-center text-[11px] leading-relaxed text-[#59616b]">
        Interactive prototype: reset requests are simulated locally. No account or password is changed.
      </p>
    </div>
  );
}
