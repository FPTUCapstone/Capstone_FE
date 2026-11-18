import { proxyPendingTours } from '@/features/admin/tour-reviews/api/tourModerationProxy';

export async function GET(request: Request) {
  return proxyPendingTours(request);
}
