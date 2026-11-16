import { proxyGetPartialRefundProposal } from "@/features/complaints/services/partialRefundProposalProxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ complaintId: string }> },
) {
  const { complaintId } = await context.params;
  return proxyGetPartialRefundProposal(request, complaintId);
}
