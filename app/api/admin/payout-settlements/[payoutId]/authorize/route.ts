import { proxyAuthorizeSettlement } from '@/features/admin/payout-settlement/payoutSettlementProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ payoutId: string }> },
) {
  const { payoutId } = await context.params;
  return proxyAuthorizeSettlement(payoutId, request);
}
