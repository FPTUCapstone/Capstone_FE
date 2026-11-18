import { proxyOperatorComplaintDetail } from '@/features/operator/post-trip-complaints/operatorPostTripComplaintsProxy';

export async function GET(request: Request, { params }: { params: Promise<{ complaintId: string }> }) {
  return proxyOperatorComplaintDetail(request, (await params).complaintId);
}
