'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PasswordField, TextField } from '@/components/ui/FormControls';
import { adminStaffEn } from '@/features/admin/staff/resources/en';
import type { AdministrationRole } from '@/features/auth/session/authSession';
import { ROUTES } from '@/lib/routes';

interface AdminSignInFormProps {
  returnUrl?: string;
}

const STAFF_ALLOWED_EXACT_ROUTES = new Set<string>([
  ROUTES.admin.staffDashboard,
  ROUTES.admin.accountSecurity,
]);

export function isAdministratorOnlyPathname(pathname: string): boolean {
  if (STAFF_ALLOWED_EXACT_ROUTES.has(pathname)) return false;
  if (pathname === ROUTES.admin.login || pathname === ROUTES.admin.forgotPassword) return false;
  return pathname === ROUTES.admin.dashboard || pathname.startsWith('/admin/');
}

export function getSafeAdminReturnUrl(
  returnUrl?: string,
  role: AdministrationRole = 'Administrator',
): string {
  const defaultDestination =
    role === 'Staff' ? ROUTES.admin.staffDashboard : ROUTES.admin.dashboard;

  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//') || returnUrl.includes('\\')) {
    return defaultDestination;
  }

  try {
    const baseUrl = 'http://tripmate.local';
    const candidate = new URL(returnUrl, baseUrl);
    const isAdminRoute =
      candidate.pathname === ROUTES.admin.dashboard || candidate.pathname.startsWith('/admin/');
    const isLoginRoute =
      candidate.pathname === ROUTES.admin.login ||
      candidate.pathname === ROUTES.admin.forgotPassword;
    if (candidate.origin !== baseUrl || !isAdminRoute || isLoginRoute) {
      return defaultDestination;
    }
    if (role === 'Staff' && isAdministratorOnlyPathname(candidate.pathname)) {
      return ROUTES.admin.staffDashboard;
    }
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return defaultDestination;
  }
}

export function AdminSignInForm({ returnUrl }: AdminSignInFormProps) {
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
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = adminStaffEn.login.invalidEmailError;
    if (!password.trim()) nextErrors.password = adminStaffEn.login.requiredFieldError;
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
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(
          result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
            ? result.message
            : adminStaffEn.login.unavailableError,
        );
        return;
      }
      const authenticatedRole: AdministrationRole =
        result && typeof result === 'object' && 'role' in result && result.role === 'Staff'
          ? 'Staff'
          : 'Administrator';
      setPassword('');
      router.replace(getSafeAdminReturnUrl(returnUrl, authenticatedRole));
      router.refresh();
    } catch {
      setMessage(adminStaffEn.login.connectionError);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <div>
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <TextField
          label={adminStaffEn.login.emailLabel}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={adminStaffEn.login.emailPlaceholder}
          value={email}
          disabled={loading}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <PasswordField
          label={adminStaffEn.login.passwordLabel}
          name="password"
          autoComplete="current-password"
          placeholder={adminStaffEn.login.passwordPlaceholder}
          value={password}
          disabled={loading}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div className="flex justify-end">
          <Link href={ROUTES.admin.forgotPassword} className="text-sm font-bold text-[#006b5f] hover:underline">
            {adminStaffEn.login.forgotPassword}
          </Link>
        </div>
        <ActionButton type="submit" loading={loading} className="w-full">
          {adminStaffEn.login.submitButton}
        </ActionButton>
      </form>
      {message ? <div className="mt-6"><FeedbackAlert tone="error">{message}</FeedbackAlert></div> : null}
      <p className="mt-6 rounded-lg bg-[#f2f4f7] px-3 py-2 text-center text-[11px] leading-relaxed text-[#59616b]">
        {adminStaffEn.login.footerNote}
      </p>
    </div>
  );
}
