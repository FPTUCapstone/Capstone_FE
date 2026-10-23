import { proxyTripDetail } from '@/features/trips/services/tripHistoryProxy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ kind: string; id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { kind, id } = await context.params;
  return proxyTripDetail(request, kind, id);
}
