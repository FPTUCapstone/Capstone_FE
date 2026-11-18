import { proxyApproveTour } from '@/features/admin/tour-reviews/api/tourModerationProxy';

interface RouteContext {
  params: Promise<{
    tourId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { tourId } = await context.params;
  return proxyApproveTour(request, tourId);
}
