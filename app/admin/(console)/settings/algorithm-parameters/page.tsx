import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AlgorithmConfigForm } from '@/features/admin/algorithm-config/AlgorithmConfigForm';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = { title: 'Algorithm Parameters' };

export default async function AlgorithmParametersPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.algorithmParameters)}`);
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <AlgorithmConfigForm />;
}
