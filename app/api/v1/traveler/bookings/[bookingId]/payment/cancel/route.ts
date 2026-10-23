import { proxyCancelPendingPayment } from '@/features/bookings/services/paymentProxy';

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
): Promise<Response> {
  const { bookingId } = await context.params;
  return proxyCancelPendingPayment(request, bookingId);
}
