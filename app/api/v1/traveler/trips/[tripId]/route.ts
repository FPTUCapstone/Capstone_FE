import { handleTravelerTripDetailBffRequest } from '@/features/trips/services/tripReviewBff';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ tripId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { tripId } = await context.params;
  return handleTravelerTripDetailBffRequest(request, tripId);
}
