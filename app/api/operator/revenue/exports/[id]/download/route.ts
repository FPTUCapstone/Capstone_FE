import { proxyDownloadRevenueExport } from '@/features/operator/finance/api/operatorRevenueExportProxy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  return proxyDownloadRevenueExport(request, id);
}
