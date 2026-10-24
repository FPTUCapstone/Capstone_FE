import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { StaffDashboardView } from '@/features/admin/staff/components/StaffDashboardView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Staff Operations Dashboard | TripMate Administration',
  description: 'Operational workspace for TripMate Staff moderation, verification, and catalog workflows.',
};

export default async function StaffDashboardPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.staffDashboard)}`);
  }

  return <StaffDashboardView />;
}
