import { proxyGetBookingRefundStatus } from '@/features/bookings/services/bookingRefundProxy';

interface Context { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) { return proxyGetBookingRefundStatus(request, (await context.params).id); }
