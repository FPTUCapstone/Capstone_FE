import { proxyPartyStaffReview } from '@/features/complaints/staff-review/partyStaffReviewProxy';

export async function GET(request: Request, context: { params: Promise<{ complaintId: string; evidenceId: string }> }) {
  const { complaintId, evidenceId } = await context.params;
  return proxyPartyStaffReview(request, 'Operator', complaintId, 'evidence', evidenceId);
}
