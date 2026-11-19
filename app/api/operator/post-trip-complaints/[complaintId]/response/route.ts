import { proxyOperatorComplaintResponse } from '@/features/operator/post-trip-complaints/operatorPostTripComplaintsProxy';

export async function POST(request: Request, { params }: { params: Promise<{ complaintId: string }> }) {
  return proxyOperatorComplaintResponse(request, (await params).complaintId);
}
