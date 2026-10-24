import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AlgorithmConfigForm } from '@/features/admin/algorithm-config/AlgorithmConfigForm';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = { title: 'Algorithm Parameters' };

export default async function AlgorithmParametersPage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.admin.algorithmParameters)}`);
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <AlgorithmConfigForm />;
}
