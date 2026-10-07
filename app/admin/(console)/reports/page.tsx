import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { StatisticalReportsView } from '@/features/admin/reports/components/StatisticalReportsView';
import { parseAdminTokenRole } from '@/features/admin/reports/guards/statisticalReportAuth';
import { ROUTES } from '@/lib/routes';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Statistical Reports | TripMate Admin Console',
  description:
    'Generate and export aggregated platform statistics from closed reporting periods.',
};

export default async function StatisticalReportsPage() {
  const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.reports)}`);
  }

  const role = parseAdminTokenRole(token) ?? 'Unknown';

  return <StatisticalReportsView actorRole={role} />;
}
