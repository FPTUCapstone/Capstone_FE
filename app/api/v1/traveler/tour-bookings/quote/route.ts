import { proxyQuoteTourBooking } from '@/features/bookings/services/tourBookingProxy';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return proxyQuoteTourBooking(request);
}
