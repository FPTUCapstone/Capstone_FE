import { proxyRespondToDirectRefundTransfer } from "@/features/bookings/services/directRefundProxy";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await context.params;
  return proxyRespondToDirectRefundTransfer(request, caseId);
}
