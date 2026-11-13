import { proxyAdminRefundResolve } from '@/features/refunds/admin/refundsAdminProxy';

export async function POST(request: Request, context: { params: Promise<{ refundId: string }> }) {
  const { refundId } = await context.params;
  return proxyAdminRefundResolve(request, refundId);
}
