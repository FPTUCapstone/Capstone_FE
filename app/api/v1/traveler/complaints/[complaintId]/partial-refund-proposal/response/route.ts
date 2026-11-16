import { proxyRespondToPartialRefundProposal } from "@/features/complaints/services/partialRefundProposalProxy";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ complaintId: string }> },
) {
  const { complaintId } = await context.params;
  return proxyRespondToPartialRefundProposal(request, complaintId);
}
