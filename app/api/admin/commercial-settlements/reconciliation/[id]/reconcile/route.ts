import { proxyStaffReconciliation } from '@/features/hotel-service-provider/server/workflowProxy';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyStaffReconciliation(request, id, 'reconcile');
}
