import { proxyProviderWorkflow } from '@/features/hotel-service-provider/server/workflowProxy';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return proxyProviderWorkflow(request, (await params).id, 'outcome');
}
