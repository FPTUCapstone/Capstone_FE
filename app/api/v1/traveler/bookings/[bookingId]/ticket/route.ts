import { proxyGetBookingTicket } from '@/features/bookings/services/ticketProxy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ bookingId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { bookingId } = await context.params;
  return proxyGetBookingTicket(request, bookingId);
}
