import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AuditLogManagementView } from '@/features/admin/audit-logs/components/AuditLogManagementView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ADMIN_ACCESS_TOKEN_COOKIE, parseAdminRoleFromToken } from '@/lib/server/adminSession';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'System Audit Logs | TripMate Admin Console',
  description: 'View operational, security, and administrative system audit logs.',
};

export default async function AuditLogsPage() {
  // Cookie presence is a navigation hint; BE remains the authorization authority.
  const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.auditLogs)}`);
  }

  const role = parseAdminRoleFromToken(token);
  if (role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <AuditLogManagementView />;
}
