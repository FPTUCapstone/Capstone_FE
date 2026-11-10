import { proxyOperatorPayoutSettlements } from '@/features/operator/payout-settlements/payoutSettlementsProxy';

export async function GET(request: Request) {
  return proxyOperatorPayoutSettlements(request);
}
