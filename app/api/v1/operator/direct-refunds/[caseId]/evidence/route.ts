import { proxyOperatorUploadDirectRefundEvidence } from "@/features/refunds/operator/directRefundOperatorProxy";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await context.params;
  return proxyOperatorUploadDirectRefundEvidence(request, caseId);
}
