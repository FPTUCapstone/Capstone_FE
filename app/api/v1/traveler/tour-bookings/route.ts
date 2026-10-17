import { proxyCreateTourBooking } from '@/features/bookings/services/tourBookingProxy';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return proxyCreateTourBooking(request);
}
