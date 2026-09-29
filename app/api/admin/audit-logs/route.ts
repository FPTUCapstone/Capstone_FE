import { proxyAuditLogs } from '@/features/admin/audit-logs/api/auditLogProxy';

export async function GET(request: Request) {
  return proxyAuditLogs(request);
}
