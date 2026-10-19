import { handleTravelerTripListBffRequest } from '@/features/trips/services/tripReviewBff';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleTravelerTripListBffRequest(request);
}
