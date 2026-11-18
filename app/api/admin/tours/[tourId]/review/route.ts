import { proxyTourReview } from '@/features/admin/tour-reviews/api/tourModerationProxy';

interface RouteContext {
  params: Promise<{
    tourId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { tourId } = await context.params;
  return proxyTourReview(request, tourId);
}
