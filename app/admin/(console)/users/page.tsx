import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { UserAccountDirectoryUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'User Accounts Directory (Backend Integration Pending) | TripMate Administration',
  description: 'User account directory and governance workspace pending backend contract integration.',
};

export default async function UserAccountsPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <UserAccountDirectoryUnavailableView />;
}
