import { proxyAdminGetCommissionStatement } from "@/features/commission/admin/commissionAdminProxy";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return proxyAdminGetCommissionStatement(request, id);
}
