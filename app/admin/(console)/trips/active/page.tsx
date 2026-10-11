import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { ActiveTripsScreen } from '@/features/admin/active-trips/ActiveTripsScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = { title: 'Active Trips | TripMate Staff' };

export default async function ActiveTripsPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.activeTrips)}`);
  }

  if (session.role !== 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return (
    <Suspense fallback={<div role="status" className="mx-auto max-w-7xl px-4 py-8 text-[#486581]">Loading active trips…</div>}>
      <ActiveTripsScreen />
    </Suspense>
  );
}
