import { proxyCreateOrReusePayment } from '@/features/bookings/services/paymentProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
  return proxyCreateOrReusePayment(request, bookingId);
}
