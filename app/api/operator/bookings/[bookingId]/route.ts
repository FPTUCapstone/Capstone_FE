import { proxyOperatorBookings } from '@/features/operator/bookings/api/operatorBookingProxy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    bookingId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { bookingId } = await context.params;
  return proxyOperatorBookings(request, bookingId);
}
