import { proxyAdminListDirectRefundDisputes } from "@/features/refunds/admin-disputes/directRefundDisputesProxy";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return proxyAdminListDirectRefundDisputes(request);
}
