import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminChangePasswordView } from '@/features/admin/account/AdminChangePasswordView';
import { ROUTES } from '@/lib/routes';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Admin Change Password | TripMate Admin',
  description: 'Đổi mật khẩu quản trị viên TripMate.',
};

export default async function AdminAccountSecurityPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value) {
    redirect(ROUTES.admin.login);
  }

  return <AdminChangePasswordView />;
}
