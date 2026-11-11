import { proxyPostBookingCancellation } from "@/features/bookings/services/cancellationProxy";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
  return proxyPostBookingCancellation(request, bookingId);
}
