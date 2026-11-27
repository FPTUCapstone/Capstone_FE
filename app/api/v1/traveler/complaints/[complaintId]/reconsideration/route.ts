import { proxyPartyStaffReview } from '@/features/complaints/staff-review/partyStaffReviewProxy';

export async function POST(request: Request, context: { params: Promise<{ complaintId: string }> }) {
  const { complaintId } = await context.params;
  return proxyPartyStaffReview(request, 'Traveler', complaintId, 'reconsideration');
}
