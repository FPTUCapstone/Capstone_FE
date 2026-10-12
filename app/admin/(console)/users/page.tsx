import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { UserAccountDirectoryUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'User Accounts Directory | TripMate Administration',
  description: 'Manage and review traveler, operator, and administrator accounts.',
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

