import { proxyEmergencyRefundReview } from '@/features/refunds/admin/refundsAdminProxy';

export async function GET(_request: Request, context: { params: Promise<{ scheduleId: string }> }) {
  return proxyEmergencyRefundReview((await context.params).scheduleId);
}
