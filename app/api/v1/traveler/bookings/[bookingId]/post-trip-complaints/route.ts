import { proxyPostTripComplaint } from '@/features/complaints/submit/services/postTripComplaintProxy';

export const dynamic = 'force-dynamic';
export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  return proxyPostTripComplaint(request, (await context.params).bookingId);
}
