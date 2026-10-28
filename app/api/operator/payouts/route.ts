import { proxyOperatorPayout } from '@/features/operator/finance/api/operatorPayoutProxy';
export const dynamic = 'force-dynamic';
export function GET(request: Request): Promise<Response> {
  return proxyOperatorPayout(request, '');
}
export function POST(request: Request): Promise<Response> {
  return proxyOperatorPayout(request, '', { forwardQuery: false });
}
