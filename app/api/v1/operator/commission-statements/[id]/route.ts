import { proxyOperatorGetCommissionStatement } from "@/features/commission/operator/commissionProxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return proxyOperatorGetCommissionStatement(request, id);
}
