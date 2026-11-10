import { proxyPayoutSettlementsList } from '@/features/admin/payout-settlements/payoutSettlementsProxy';

export async function GET(request: Request) {
  return proxyPayoutSettlementsList(request);
}
