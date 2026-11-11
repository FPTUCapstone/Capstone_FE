import { proxyRefreshTicketQr } from '@/features/bookings/services/ticketProxy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ ticketId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { ticketId } = await context.params;
  return proxyRefreshTicketQr(request, ticketId);
}
