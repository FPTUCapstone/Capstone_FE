import { proxyGetBookingPaymentStatus } from '@/features/bookings/services/paymentProxy';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
  return proxyGetBookingPaymentStatus(request, bookingId);
}
