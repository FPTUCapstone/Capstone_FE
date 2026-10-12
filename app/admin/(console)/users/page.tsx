import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { UserAccountDirectoryUnavailableView } from '@/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export default async function UserAccountsPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    redirect('/admin/login?returnUrl=%2Fadmin%2Fusers');
  }

  return <UserAccountDirectoryUnavailableView />;
}
