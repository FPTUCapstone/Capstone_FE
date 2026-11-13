import { proxyAdminRefundDetail } from '@/features/refunds/admin/refundsAdminProxy';

export async function GET(request: Request, context: { params: Promise<{ refundId: string }> }) {
  const { refundId } = await context.params;
  return proxyAdminRefundDetail(request, refundId);
}
