import { accountSession } from '@/features/admin/user-accounts/server/accounts';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ActiveTripsScreen } from '@/features/admin/active-trips/ActiveTripsScreen';

export const metadata: Metadata = { title: 'Active Trips | TripMate Admin' };

export default async function ActiveTripsPage() {
  const session = await accountSession();
  if (!session) return redirect('/admin/login?returnUrl=%2Fadmin%2Ftrips%2Factive');
  if (session.role !== 'Staff') return <AdminAccessDeniedView requiredRole="Staff" />;

  return (
    <Suspense fallback={<div role="status" className="mx-auto max-w-7xl px-4 py-8 text-[#5B6E69]">Loading active trips…</div>}>
      <ActiveTripsScreen />
    </Suspense>
  );
}
