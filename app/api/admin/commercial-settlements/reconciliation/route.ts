import { proxyStaffReconciliation } from '@/features/hotel-service-provider/server/workflowProxy';

export async function GET(request: Request) {
  return proxyStaffReconciliation(request);
}
