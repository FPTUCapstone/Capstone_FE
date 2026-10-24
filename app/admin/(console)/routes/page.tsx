import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { RouteDirectoryUnavailableView } from '@/features/admin/routes/components/RouteDirectoryUnavailableView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: 'Route Master Data (Backend Integration Pending) | TripMate Administration',
  description: 'Route catalog and governance workspace pending backend contract integration.',
};

export default async function RoutesPage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect('/sign-in?returnUrl=%2Fadmin%2Froutes');
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <RouteDirectoryUnavailableView />;
}
