import {
  proxyAdminIssueCommissionStatement,
  proxyAdminListCommissionStatements,
} from "@/features/commission/admin/commissionAdminProxy";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return proxyAdminListCommissionStatements(request);
}

export async function POST(request: Request): Promise<Response> {
  return proxyAdminIssueCommissionStatement(request);
}
