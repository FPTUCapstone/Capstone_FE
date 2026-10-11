import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { RouteDirectoryUnavailableView } from '@/features/admin/routes/components/RouteDirectoryUnavailableView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export default async function RoutesPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    redirect('/admin/login?returnUrl=%2Fadmin%2Froutes');
  }

  return <RouteDirectoryUnavailableView />;
}
