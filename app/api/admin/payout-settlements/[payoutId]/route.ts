import { proxyGetSettlementDetail } from '@/features/admin/payout-settlement/payoutSettlementProxy';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ payoutId: string }> },
) {
  const { payoutId } = await context.params;
  return proxyGetSettlementDetail(payoutId);
}
