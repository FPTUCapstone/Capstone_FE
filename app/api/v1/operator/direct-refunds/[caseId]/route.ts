import { proxyOperatorGetDirectRefundCase } from "@/features/refunds/operator/directRefundOperatorProxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await context.params;
  return proxyOperatorGetDirectRefundCase(request, caseId);
}
