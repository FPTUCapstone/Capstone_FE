import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
export default async function StaffComplaintLayout({ children }: { children: ReactNode }) {
  const session = verifyAdminSessionFromCookies(await cookies());
  if (!session) redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.staffPostTripComplaints)}`);
  if (session.role !== 'Staff') redirect(ROUTES.admin.dashboard);
  return children;
}
