import type { Metadata } from "next";

import { PartialRefundProposalPage } from "@/features/complaints/components/PartialRefundProposalPage";

export const metadata: Metadata = {
  title: "Partial refund proposal",
  description: "Accept or decline the partial refund proposed by the Tour Operator.",
};

interface AccountPartialRefundProposalRouteProps {
  params: Promise<{ id: string }>;
}

/** UC-75 screen #97 Partial Refund Proposal. */
export default async function AccountPartialRefundProposalRoute({
  params,
}: AccountPartialRefundProposalRouteProps) {
  const { id } = await params;
  return <PartialRefundProposalPage complaintId={id} />;
}
