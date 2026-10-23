import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PlatformBookingsScreen } from '@/features/admin/platform-bookings/PlatformBookingsScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Platform Bookings | TripMate Admin Console',
  description: 'View platform-wide tour booking and payment states.',
};

export default async function PlatformBookingsPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.bookings)}`);
  }

  if (session.role !== 'Staff') {
    return <AdminAccessDeniedView requiredRole="Staff" />;
  }

  return <PlatformBookingsScreen />;
}
