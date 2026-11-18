import { proxyDeactivatePoi } from '@/features/admin/catalogue/services/poi-management-proxy';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyDeactivatePoi(request, id);
}
