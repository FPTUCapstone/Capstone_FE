import { proxyApproveDraftVersion } from '@/features/admin/tour-reviews/api/pendingChangeModerationProxy';

interface RouteContext {
  params: Promise<{
    pendingChangeId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { pendingChangeId } = await context.params;
  return proxyApproveDraftVersion(request, pendingChangeId);
}
