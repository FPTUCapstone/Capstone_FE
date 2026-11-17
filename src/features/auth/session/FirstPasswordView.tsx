'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChangePasswordForm } from '@/features/account/security/ChangePasswordForm';
import { createWebChangePasswordCapability } from '@/features/account/security/webChangePasswordCapability';
import { createAdminChangePasswordCapability } from '@/features/admin/account/adminChangePasswordCapability';
import { signOutAdminSession } from '@/features/admin/auth/services/adminSessionClient';
import { webLogout } from '@/lib/authApi';
import { AuthStorage } from './authSession';
import { useWebSession } from './useWebSession';
import { signInDestination } from '../routing/signInDestination';

export function FirstPasswordView({ administration = false, destination = '/admin/staff' }: { administration?: boolean; destination?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const capability = administration ? createAdminChangePasswordCapability() : createWebChangePasswordCapability();
  async function logout() {
    setLoggingOut(true);
    try {
      await (administration ? signOutAdminSession() : webLogout());
      AuthStorage.clear();
      router.replace(administration ? '/admin/login' : '/sign-in');
      router.refresh();
    } catch { setMessage('Unable to sign out. Please try again.'); setLoggingOut(false); }
  }
  function success() {
    if (administration) { router.replace(destination); router.refresh(); return; }
    const context = AuthStorage.getContext();
    if (!context || context.mustChangePassword) { setMessage('Your password-change status could not be confirmed. Please sign out and sign in again.'); return; }
    router.replace(signInDestination(context) ?? '/sign-in');
    router.refresh();
  }
  return <main className="mx-auto max-w-xl space-y-5 px-4 py-10">
    <p className="text-sm text-[#5B6E69]">Change your temporary password to continue.</p>
    {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
    <ChangePasswordForm capability={capability} onSuccess={success} onSessionExpired={() => router.replace(administration ? '/admin/login' : '/sign-in')} />
    <button type="button" onClick={logout} disabled={loggingOut} className="min-h-11 rounded-lg border border-[#DCE2DD] px-4 text-sm font-semibold">{loggingOut ? 'Signing out…' : 'Sign out'}</button>
  </main>;
}

export function WebFirstPasswordPage() {
  const { status, context } = useWebSession();
  if (status === 'restoring') return <p role="status" className="p-8">Restoring session…</p>;
  if (!context) return <p className="p-8">Your session has expired. <a href="/sign-in">Sign in again</a></p>;
  return <FirstPasswordView />;
}
