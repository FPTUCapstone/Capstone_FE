'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { webLogout } from '@/lib/authApi';
import { AuthStorage } from '@/features/auth/session/authSession';
import { ToastProvider } from './common/Toast';

export function ProviderWorkspaceShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true);
    try { await webLogout(); AuthStorage.clear(); router.replace('/sign-in'); router.refresh(); }
    catch { setError('Unable to sign out. Please try again.'); setBusy(false); }
  }
  return <ToastProvider>
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]">
      <header className="border-b border-[#DCE2DD] bg-white px-4 sm:px-8">
        <nav aria-label="Service Provider workspace" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/provider/bookings" className="inline-flex min-h-11 items-center text-lg font-bold">TripMate <span className="ml-3 text-sm font-normal text-[#5B6E69]">Service Provider</span></Link>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/provider/bookings" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">Booking Requests</Link>
            <Link href="/provider/statements" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700">Commission Statements</Link>
            <button type="button" onClick={logout} disabled={busy} className="min-h-11 rounded-lg border border-[#DCE2DD] px-4 text-sm font-semibold disabled:opacity-50">{busy ? 'Signing out…' : 'Sign out'}</button>
          </div>
        </nav>
      </header>
      {error && <p role="alert" className="mx-auto max-w-7xl px-4 py-3 text-red-700">{error}</p>}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  </ToastProvider>;
}
