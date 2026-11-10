import { proxyPayoutBatchAction } from '@/features/admin/payout-settlements/payoutSettlementsProxy';

export async function POST(request: Request, context: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await context.params;
  return proxyPayoutBatchAction(request, batchId, 'carry-over');
}
