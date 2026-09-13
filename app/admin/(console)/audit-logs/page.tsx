import type { Metadata } from 'next';
import { AuditLogManagementView } from '@/features/admin/audit-logs/components/AuditLogManagementView';

export const metadata: Metadata = {
  title: 'System Audit Logs | TripMate Admin Console',
  description: 'View operational, security, and administrative system audit logs.',
};

export default function AuditLogsPage() {
  return <AuditLogManagementView />;
}
