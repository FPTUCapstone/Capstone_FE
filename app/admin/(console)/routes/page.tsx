import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { RouteDirectoryUnavailableView } from '@/features/admin/routes/components/RouteDirectoryUnavailableView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Route Master Data (Backend Integration Pending) | TripMate Administration',
  description: 'Route catalog and governance workspace pending backend contract integration.',
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

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <RouteDirectoryUnavailableView />;
}
