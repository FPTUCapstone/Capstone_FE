import { proxyRevenueExports } from '@/features/operator/finance/api/operatorRevenueExportProxy';

export const dynamic = 'force-dynamic';

export function POST(request: Request): Promise<Response> {
  return proxyRevenueExports(request);
}

export function GET(request: Request): Promise<Response> {
  return proxyRevenueExports(request);
}
