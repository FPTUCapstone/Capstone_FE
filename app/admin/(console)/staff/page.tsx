import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { StaffDashboardView } from '@/features/admin/staff/components/StaffDashboardView';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: 'Staff Operations Dashboard | TripMate Administration',
  description: 'Operational workspace for TripMate Staff moderation, verification, and catalog workflows.',
};

export default async function StaffDashboardPage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.admin.staffDashboard)}`);
  }

  return <StaffDashboardView />;
}
