import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { UpdateRouteUnavailableView } from '@/features/admin/routes/components/UpdateRouteUnavailableView';
import { parseRouteId } from '@/features/admin/routes/utils/routeIdValidator';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

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
    redirect('/admin/login?returnUrl=%2Fadmin%2Froutes');
  }

  const { routeId: rawRouteId } = await params;
  const routeId = parseRouteId(rawRouteId);
  if (routeId === null) {
    notFound();
  }

  return <UpdateRouteUnavailableView routeId={routeId} />;
}
