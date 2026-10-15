import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminChangePasswordView } from '@/features/admin/account/AdminChangePasswordView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Admin Change Password | TripMate Admin',
  description: 'Đổi mật khẩu quản trị viên TripMate.',
};

export default async function AdminAccountSecurityPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(ROUTES.admin.login);
  }

  // SRS_INTERNAL_CONFLICT (spec §3): Staff change-password support is not
  // approved yet. The route itself stays reachable so a valid Staff session
  // never 404s/redirects confusingly, but the view must not claim the real
  // capability as delivered for that role.
  return <AdminChangePasswordView role={session.role} />;
}
