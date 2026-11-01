import { proxyGetSettlementQueue } from '@/features/admin/payout-settlement/payoutSettlementProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return proxyGetSettlementQueue(request);
}
