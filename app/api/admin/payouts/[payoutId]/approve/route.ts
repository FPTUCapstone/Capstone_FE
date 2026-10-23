import { proxyApprovePayout } from '@/features/admin/payout-review/payoutReviewProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ payoutId: string }> },
) {
  const { payoutId } = await context.params;
  return proxyApprovePayout(payoutId, request);
}
