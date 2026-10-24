import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { StatisticalReportsView } from '@/features/admin/reports/components/StatisticalReportsView';
import { resolveStatisticalWorkspaceMode } from '@/features/admin/reports/guards/statisticalReportAuth';
import { statisticalReportsEn } from '@/features/admin/reports/resources/en';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: statisticalReportsEn.metadata.title,
  description: statisticalReportsEn.metadata.description,
};

export interface StatisticalReportsPageProps {
  readonly searchParams?: Promise<{ readonly demo?: string | string[] }>;
}

export default async function StatisticalReportsPage(props: StatisticalReportsPageProps) {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.admin.reports)}`);
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  const resolvedSearchParams = props?.searchParams ? await props.searchParams : undefined;
  const mode = resolveStatisticalWorkspaceMode({
    demoQueryParam: resolvedSearchParams?.demo,
  });

  return <StatisticalReportsView actorRole={session.role} initialMode={mode} />;
}
