import { proxyOperatorPayout } from '@/features/operator/finance/api/operatorPayoutProxy';
export const dynamic = 'force-dynamic';
export function GET(request: Request): Promise<Response> {
  return proxyOperatorPayout(request, 'available-balance');
}
