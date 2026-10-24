import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { UserAccountDirectoryUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: 'User Accounts Directory (Backend Integration Pending) | TripMate Administration',
  description: 'User account directory and governance workspace pending backend contract integration.',
};

export default async function UserAccountsPage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect('/sign-in?returnUrl=%2Fadmin%2Fusers');
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <UserAccountDirectoryUnavailableView />;
}
