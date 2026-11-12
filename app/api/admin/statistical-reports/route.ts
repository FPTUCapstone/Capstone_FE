import { proxyStatisticalReport } from '@/features/admin/reports/services/statisticalReportsProxy';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { return proxyStatisticalReport(request); }
