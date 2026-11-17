import { proxyProvisionAccount } from '@/features/hotel-service-provider/server/workflowProxy';

export const POST = (request: Request) => proxyProvisionAccount(request, 'provider');
