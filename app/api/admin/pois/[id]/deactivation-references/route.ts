import { proxyPoiDeactivationReferences } from '@/features/admin/catalogue/services/poi-management-proxy';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyPoiDeactivationReferences(request, id);
}
