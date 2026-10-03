import { proxyActiveTrips } from '@/features/admin/active-trips/activeTripsProxy';

export async function GET(request: Request) {
  return proxyActiveTrips(request);
}
