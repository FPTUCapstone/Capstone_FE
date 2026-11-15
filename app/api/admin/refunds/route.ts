import { proxyAdminRefundsList } from '@/features/refunds/admin/refundsAdminProxy';

export async function GET(request: Request) {
  return proxyAdminRefundsList(request);
}
