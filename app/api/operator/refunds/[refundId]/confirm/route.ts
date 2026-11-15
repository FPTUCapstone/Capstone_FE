import { proxyOperatorRefundConfirm } from '@/features/refunds/operator/refundsOperatorProxy';

export async function POST(request: Request, context: { params: Promise<{ refundId: string }> }) {
  const { refundId } = await context.params;
  return proxyOperatorRefundConfirm(request, refundId);
}
