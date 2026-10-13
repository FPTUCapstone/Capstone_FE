import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { UpdateRouteUnavailableView } from '@/features/admin/routes/components/UpdateRouteUnavailableView';
import { parseRouteId } from '@/features/admin/routes/utils/routeIdValidator';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Update Route (Backend Integration Pending) | TripMate Administration',
  description: 'Route update workspace pending backend contract integration.',
};

interface RouteDetailPageProps {
  params: Promise<{ routeId: string }>;
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
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

  const { routeId: rawRouteId } = await params;
  const routeId = parseRouteId(rawRouteId);
  if (routeId === null) {
    notFound();
  }

  return <UpdateRouteUnavailableView routeId={routeId} />;
}
