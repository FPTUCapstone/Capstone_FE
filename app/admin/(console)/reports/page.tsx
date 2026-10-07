import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { StatisticalReportsView } from '@/features/admin/reports/components/StatisticalReportsView';
import {
  parseAdminTokenRole,
  resolveStatisticalWorkspaceMode,
} from '@/features/admin/reports/guards/statisticalReportAuth';
import { statisticalReportsEn } from '@/features/admin/reports/resources/en';
import { ROUTES } from '@/lib/routes';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: statisticalReportsEn.metadata.title,
  description: statisticalReportsEn.metadata.description,
};

export interface StatisticalReportsPageProps {
  readonly searchParams?: Promise<{ readonly demo?: string | string[] }>;
}

export default async function StatisticalReportsPage(props: StatisticalReportsPageProps) {
  const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.reports)}`);
  }

  const resolvedSearchParams = props?.searchParams ? await props.searchParams : undefined;
  const mode = resolveStatisticalWorkspaceMode({
    demoQueryParam: resolvedSearchParams?.demo,
  });
  const role = parseAdminTokenRole(token) ?? 'Unknown';

  return <StatisticalReportsView actorRole={role} initialMode={mode} />;
}
