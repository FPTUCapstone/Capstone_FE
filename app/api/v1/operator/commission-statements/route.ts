import { proxyOperatorListCommissionStatements } from "@/features/commission/operator/commissionProxy";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return proxyOperatorListCommissionStatements(request);
}
