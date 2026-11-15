import { proxyProviderWorkflow } from '@/features/hotel-service-provider/server/workflowProxy';

export const GET = (request: Request) => proxyProviderWorkflow(request);
