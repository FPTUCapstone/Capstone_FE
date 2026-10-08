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

  return <AdminChangePasswordView />;
}
