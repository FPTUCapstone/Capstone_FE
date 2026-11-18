import { proxyOperatorComplaintEvidenceDownload } from '@/features/operator/post-trip-complaints/operatorPostTripComplaintsProxy';

export async function GET(
  request: Request,
  context: { params: Promise<{ complaintId: string; evidenceId: string }> },
) {
  const { complaintId, evidenceId } = await context.params;
  return proxyOperatorComplaintEvidenceDownload(request, complaintId, evidenceId);
}
