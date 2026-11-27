import { proxyPendingChangeDetail } from '@/features/admin/tour-reviews/api/pendingChangeModerationProxy';

interface RouteContext {
  params: Promise<{
    pendingChangeId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { pendingChangeId } = await context.params;
  return proxyPendingChangeDetail(request, pendingChangeId);
}
