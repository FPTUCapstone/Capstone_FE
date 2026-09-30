import { proxyAuditLogDetail } from '@/features/admin/audit-logs/api/auditLogProxy';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyAuditLogDetail(request, id);
}
