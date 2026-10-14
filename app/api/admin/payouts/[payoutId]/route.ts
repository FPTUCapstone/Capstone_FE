import { proxyGetPayoutDetail } from '@/features/admin/payout-review/payoutReviewProxy';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ payoutId: string }> },
) {
  const { payoutId } = await context.params;
  return proxyGetPayoutDetail(payoutId);
}
