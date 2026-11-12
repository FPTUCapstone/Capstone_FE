import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { StatisticalReportsView } from '@/features/admin/reports/components/StatisticalReportsView';
import { statisticalReportsEn } from '@/features/admin/reports/resources/en';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: statisticalReportsEn.metadata.title,
  description: statisticalReportsEn.metadata.description,
};

/** Legacy query shape retained while the demo switch is ignored. */
export interface StatisticalReportsPageProps {
  readonly searchParams?: Promise<{ readonly demo?: string | string[] }>;
}

export default async function StatisticalReportsPage(_props: StatisticalReportsPageProps = {}) {
  void _props;
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.reports)}`);
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <StatisticalReportsView actorRole={session.role} initialMode="PRODUCTION" />;
}
