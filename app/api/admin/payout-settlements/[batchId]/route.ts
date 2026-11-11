import { proxyFailedPayoutBatchDetail } from '@/features/admin/payout-settlements/payoutSettlementsProxy';

export async function GET(request: Request, context: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await context.params;
  return proxyFailedPayoutBatchDetail(request, batchId);
}
