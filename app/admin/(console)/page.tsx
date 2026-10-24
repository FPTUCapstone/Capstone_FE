import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminDashboard } from '@/features/admin/dashboard/AdminDashboard';
import { adminDashboardEn } from '@/features/admin/dashboard/resources/en';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: adminDashboardEn.metadataTitle,
};

export default async function AdminConsolePage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.admin.dashboard)}`);
  }

  if (session.role === 'Staff') {
    return redirect(ROUTES.admin.staffDashboard);
  }

  return <AdminDashboard />;
}
