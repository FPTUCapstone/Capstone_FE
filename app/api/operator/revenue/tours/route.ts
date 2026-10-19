import { proxyOperatorRevenue } from '@/features/operator/finance/api/operatorRevenueProxy';
export const dynamic = 'force-dynamic';
export function GET(request: Request): Promise<Response> { return proxyOperatorRevenue(request, 'tours'); }
