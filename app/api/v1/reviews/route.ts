import { handleTravelerReviewCreateBffRequest } from '@/features/trips/services/tripReviewBff';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return handleTravelerReviewCreateBffRequest(request);
}
