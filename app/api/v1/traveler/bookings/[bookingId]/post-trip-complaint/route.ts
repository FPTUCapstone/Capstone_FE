import { proxyGetPostTripComplaintContext } from '@/features/complaints/submit/services/postTripComplaintProxy';

export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  return proxyGetPostTripComplaintContext(request, (await context.params).bookingId);
}
