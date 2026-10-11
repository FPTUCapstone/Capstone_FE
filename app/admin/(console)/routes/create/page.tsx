import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CreateRouteUnavailableView } from '@/features/admin/routes/components/CreateRouteUnavailableView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export default async function CreateRoutePage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    redirect('/admin/login?returnUrl=%2Fadmin%2Froutes%2Fcreate');
  }

  return <CreateRouteUnavailableView />;
}
