import { proxyProviderAvailability } from '@/features/hotel-service-provider/server/workflowProxy';

export async function PUT(request: Request, context: { params: Promise<{ serviceId: string; startsAt: string }> }) {
  const { serviceId, startsAt } = await context.params;
  return proxyProviderAvailability(request, serviceId, startsAt);
}
