import { proxyGetBookingRefundProgress } from "@/features/bookings/services/refundProgressProxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
  return proxyGetBookingRefundProgress(request, bookingId);
}
