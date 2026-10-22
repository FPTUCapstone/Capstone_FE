import { proxyOperatorPayout } from '@/features/operator/finance/api/operatorPayoutProxy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    payoutCode: string;
  }>;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const { payoutCode } = await context.params;
  return proxyOperatorPayout(request, `${encodeURIComponent(payoutCode)}/cancel`, { forwardQuery: false });
}
