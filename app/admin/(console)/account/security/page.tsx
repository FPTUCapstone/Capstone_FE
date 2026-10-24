import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminChangePasswordView } from '@/features/admin/account/AdminChangePasswordView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Change Password | TripMate Administration',
  description: 'Đổi mật khẩu cho tài khoản nội bộ TripMate.',
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

  // UC-07 permits both internal roles to change only their own password.
  // The BFF preserves the verified session role and the backend derives the
  // subject from its bearer token.
  return <AdminChangePasswordView />;
}
