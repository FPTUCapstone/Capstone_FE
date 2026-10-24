import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminChangePasswordView } from '@/features/admin/account/AdminChangePasswordView';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: 'Change Password | TripMate Administration',
  description: 'Đổi mật khẩu cho tài khoản nội bộ TripMate.',
};

export default async function AdminAccountSecurityPage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(ROUTES.signIn);
  }

  // UC-07 permits both internal roles to change only their own password.
  // The BFF preserves the verified session role and the backend derives the
  // subject from its bearer token.
  return <AdminChangePasswordView />;
}
