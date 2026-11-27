import { proxyGetDirectRefundCaseByBooking } from "@/features/bookings/services/directRefundProxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
): Promise<Response> {
  const { bookingId } = await context.params;
  return proxyGetDirectRefundCaseByBooking(request, bookingId);
}
