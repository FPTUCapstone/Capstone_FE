import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminDashboard } from '@/features/admin/dashboard/AdminDashboard';
import { adminDashboardEn } from '@/features/admin/dashboard/resources/en';
import { ROUTES } from '@/lib/routes';
import { ADMIN_ACCESS_TOKEN_COOKIE, parseAdminRoleFromToken } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: adminDashboardEn.metadataTitle,
};

export default async function AdminConsolePage() {
  let role: 'Administrator' | 'Staff' | null = null;
  try {
    const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    role = parseAdminRoleFromToken(token);
  } catch {
    role = null;
  }

  if (role === 'Staff') {
    redirect(ROUTES.admin.staffDashboard);
  }

  return <AdminDashboard />;
}
