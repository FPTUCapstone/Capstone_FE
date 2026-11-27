import { proxyAdminDownloadDirectRefundEvidence } from '@/features/refunds/admin-disputes/directRefundDisputesProxy';

export async function GET(request: Request, context: { params: Promise<{ caseId: string; evidenceId: string }> }) {
  const { caseId, evidenceId } = await context.params;
  return proxyAdminDownloadDirectRefundEvidence(request, caseId, evidenceId);
}
