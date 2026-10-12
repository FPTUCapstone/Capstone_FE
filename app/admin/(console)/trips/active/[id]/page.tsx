import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { isValidTripId } from '@/features/admin/active-trip-details/activeTripDetails';
import { ActiveTripDetailsScreen } from '@/features/admin/active-trip-details/ActiveTripDetailsScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: isValidTripId(id) ? `Active Trip TRIP-${id} | TripMate Staff` : 'Active Trip Not Found' };
}

export default async function ActiveTripDetailsPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidTripId(id)) notFound();

  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(`${ROUTES.admin.activeTrips}/${id}`)}`);
  }

  if (session.role !== 'Staff') {
    return <AdminAccessDeniedView requiredRole="Staff" />;
  }

  return <ActiveTripDetailsScreen tripId={id} />;
}
