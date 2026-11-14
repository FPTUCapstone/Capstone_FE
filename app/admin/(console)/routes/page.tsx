import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { RouteDirectoryView } from '@/features/admin/routes/components/RouteDirectoryView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Routes List | TripMate Administration',
  description: 'Routes available to TripMate itinerary planning and navigation.',
};

export default async function RoutesPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect('/admin/login?returnUrl=%2Fadmin%2Froutes');
  }

  if (session.role !== 'Staff') {
    return <AdminAccessDeniedView requiredRole="Staff" description="You do not have permission to access this function." />;
  }

  return <RouteDirectoryView />;
}
