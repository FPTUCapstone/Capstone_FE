import { proxyProviderAvailability } from '@/features/hotel-service-provider/server/workflowProxy';

export async function GET(request: Request, context: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await context.params;
  return proxyProviderAvailability(request, serviceId);
}
