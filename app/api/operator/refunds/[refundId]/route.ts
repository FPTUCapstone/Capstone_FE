import { proxyOperatorRefundDetail } from '@/features/refunds/operator/refundsOperatorProxy';

export async function GET(request: Request, context: { params: Promise<{ refundId: string }> }) {
  const { refundId } = await context.params;
  return proxyOperatorRefundDetail(request, refundId);
}
