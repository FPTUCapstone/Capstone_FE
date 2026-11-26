import { proxyModerationQueue } from '@/features/admin/tour-reviews/api/pendingChangeModerationProxy';

export async function GET(request: Request) {
  return proxyModerationQueue(request);
}
