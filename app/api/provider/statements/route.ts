import { proxyProviderStatements } from '@/features/hotel-service-provider/server/workflowProxy';

export async function GET(request: Request) {
  return proxyProviderStatements(request);
}
