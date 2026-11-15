import { proxyProvisionAccount } from '@/features/hotel-service-provider/server/workflowProxy';

export const GET = (request: Request) => proxyProvisionAccount(request, 'pois');
