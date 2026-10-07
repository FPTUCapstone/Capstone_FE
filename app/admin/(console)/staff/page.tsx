import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { StaffDashboardView } from '@/features/admin/staff/components/StaffDashboardView';
import { ROUTES } from '@/lib/routes';
import { ADMIN_ACCESS_TOKEN_COOKIE, parseAdminRoleFromToken } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Staff Operations Dashboard | TripMate Administration',
  description: 'Operational workspace for TripMate Staff moderation, verification, and catalog workflows.',
};

export default async function StaffDashboardPage() {
  const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  const role = parseAdminRoleFromToken(token);
  if (!role) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.staffDashboard)}`);
  }

  return <StaffDashboardView />;
}
