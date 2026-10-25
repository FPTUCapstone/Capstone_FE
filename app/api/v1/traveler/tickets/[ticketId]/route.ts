import { proxyGetTicket } from '@/features/bookings/services/ticketProxy';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ ticketId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { ticketId } = await context.params;
  return proxyGetTicket(request, ticketId);
}
