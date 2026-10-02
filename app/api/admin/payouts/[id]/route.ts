import { proxyPayoutDetails } from '@/features/admin/payout-details/payoutDetailsProxy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyPayoutDetails(id);
}
