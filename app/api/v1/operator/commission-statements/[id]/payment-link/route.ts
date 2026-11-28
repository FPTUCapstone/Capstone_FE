import { proxyOperatorCreateCommissionPaymentLink } from "@/features/commission/operator/commissionProxy";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return proxyOperatorCreateCommissionPaymentLink(request, id);
}
