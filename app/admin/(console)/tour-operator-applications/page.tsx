import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { TourOperatorApplicationListView } from '@/features/admin/tour-operator-applications/components/TourOperatorApplicationListView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Tour Operator Applications Queue | TripMate Admin',
  description: 'UC-50: Operational review queue for tour operator business registrations.',
};

export default async function TourOperatorApplicationsPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.tourOperatorApplications)}`);
  }

  return <TourOperatorApplicationListView />;
}
