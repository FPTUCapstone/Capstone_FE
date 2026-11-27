import { proxyLiveTourForDiff } from '@/features/admin/tour-reviews/api/pendingChangeModerationProxy';

interface RouteContext {
  params: Promise<{
    tourId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { tourId } = await context.params;
  return proxyLiveTourForDiff(request, tourId);
}
