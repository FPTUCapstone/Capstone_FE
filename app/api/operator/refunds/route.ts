import { proxyOperatorRefundsList } from '@/features/refunds/operator/refundsOperatorProxy';

export async function GET(request: Request) {
  return proxyOperatorRefundsList(request);
}
