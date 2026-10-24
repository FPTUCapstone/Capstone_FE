import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuditLogManagementView } from '@/features/admin/audit-logs/components/AuditLogManagementView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: 'System Audit Logs | TripMate Admin Console',
  description: 'View operational, security, and administrative system audit logs.',
};

export default async function AuditLogsPage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.admin.auditLogs)}`);
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <AuditLogManagementView />;
}
