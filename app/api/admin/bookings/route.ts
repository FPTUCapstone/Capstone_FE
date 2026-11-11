import { proxyPlatformBookings } from '@/features/admin/platform-bookings/platformBookingsProxy';

export async function GET(request: Request) {
  return proxyPlatformBookings(request);
}
