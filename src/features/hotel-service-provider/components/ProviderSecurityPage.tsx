'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChangePasswordForm } from '@/features/account/security/ChangePasswordForm';
import { createWebChangePasswordCapability } from '@/features/account/security/webChangePasswordCapability';
import { signInDestination } from '@/features/auth/routing/signInDestination';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

const SIGN_IN_URL = `${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.provider.security)}`;

export function ProviderSecurityPage() {
  const router = useRouter();
  const { status, context } = useWebSession();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace(SIGN_IN_URL);
    else if (status === 'authenticated' && context &&
      (context.role !== 'ServiceProvider' || context.mustChangePassword)) {
      router.replace(signInDestination(context) ?? ROUTES.signIn);
    }
  }, [status, context, router]);

  if (status === 'restoring') return <p role="status">Restoring session…</p>;
  if (status !== 'authenticated' || !context || context.role !== 'ServiceProvider' || context.mustChangePassword) return null;

  return <section className="mx-auto max-w-3xl space-y-5" aria-labelledby="provider-security-title">
    <h1 id="provider-security-title" className="text-2xl font-bold text-brand-textPrimary">Account security</h1>
    <p className="text-sm text-brand-textSecondary">Change your password to keep your Service Provider account secure.</p>
    <ChangePasswordForm
      capability={createWebChangePasswordCapability()}
      userDisplay={{ name: context.fullName, email: context.email, role: context.role }}
      onCancel={() => router.push(ROUTES.provider.dashboard)}
      onSessionExpired={() => router.replace(SIGN_IN_URL)}
    />
  </section>;
}
