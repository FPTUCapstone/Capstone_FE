import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminDashboard } from '@/features/admin/dashboard/AdminDashboard';
import { adminDashboardEn } from '@/features/admin/dashboard/resources/en';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: adminDashboardEn.metadataTitle,
};

export default async function AdminConsolePage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.dashboard)}`);
  }

  if (session.role === 'Staff') {
    return redirect(ROUTES.admin.staffDashboard);
  }

  return <AdminDashboard />;
}
