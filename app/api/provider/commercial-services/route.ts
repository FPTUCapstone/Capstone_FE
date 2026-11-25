import { proxyProviderAvailability } from '@/features/hotel-service-provider/server/workflowProxy';

export const GET = (request: Request) => proxyProviderAvailability(request);
