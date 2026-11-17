import { proxyPostPostTripComplaintEvidenceAmendment } from '@/features/complaints/submit/services/postTripComplaintProxy';

export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  return proxyPostPostTripComplaintEvidenceAmendment(request, (await context.params).bookingId);
}
