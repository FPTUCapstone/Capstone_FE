import { proxyDownloadPostTripComplaintEvidence } from '@/features/complaints/submit/services/postTripComplaintProxy';

export async function GET(request: Request, context: { params: Promise<{ bookingId: string; evidenceId: string }> }) {
  const { bookingId, evidenceId } = await context.params;
  return proxyDownloadPostTripComplaintEvidence(request, bookingId, evidenceId);
}
