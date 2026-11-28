import {
  proxyGetDirectRefundCase,
  proxyConfirmDirectRefundRecipient,
} from "@/features/bookings/services/directRefundProxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await context.params;
  return proxyGetDirectRefundCase(request, caseId);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ caseId: string }> },
): Promise<Response> {
  const { caseId } = await context.params;
  return proxyConfirmDirectRefundRecipient(request, caseId);
}
