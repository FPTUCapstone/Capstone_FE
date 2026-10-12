import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { UserAccountDirectoryView } from '@/features/admin/user-accounts/components/UserAccountDirectoryView';
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

  return <UserAccountDirectoryView />;
}
