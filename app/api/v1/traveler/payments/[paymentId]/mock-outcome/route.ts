import { proxyCompleteMockPayment } from '@/features/bookings/services/paymentProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await context.params;
  return proxyCompleteMockPayment(request, paymentId);
}
