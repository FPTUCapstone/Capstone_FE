import { proxyActiveTripDetails } from '@/features/admin/active-trip-details/activeTripDetailsProxy';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyActiveTripDetails(id);
}
