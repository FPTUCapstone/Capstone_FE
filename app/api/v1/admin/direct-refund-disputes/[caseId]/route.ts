import { proxyAdminGetDirectRefundDispute } from "@/features/refunds/admin-disputes/directRefundDisputesProxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await context.params;
  return proxyAdminGetDirectRefundDispute(request, caseId);
}
