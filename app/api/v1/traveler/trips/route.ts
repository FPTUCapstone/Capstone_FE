import { proxyTripHistoryList } from '@/features/trips/services/tripHistoryProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return proxyTripHistoryList(request);
}
