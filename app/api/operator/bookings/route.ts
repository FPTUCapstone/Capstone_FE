import { proxyOperatorBookings } from '@/features/operator/bookings/api/operatorBookingProxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Promise<Response> {
  return proxyOperatorBookings(request);
}
