import { proxyAdminRefundReturnReceived } from '@/features/refunds/admin/refundsAdminProxy';

export async function POST(request: Request, context: { params: Promise<{ refundId: string }> }) {
  const { refundId } = await context.params;
  return proxyAdminRefundReturnReceived(request, refundId);
}
