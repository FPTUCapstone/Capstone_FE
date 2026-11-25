import { proxyConsoleInbox } from '@/features/notifications/server/consoleInboxProxy';

export async function POST(request: Request, context: { params: Promise<{ notificationId: string }> }) {
  const { notificationId } = await context.params;
  return proxyConsoleInbox(request, notificationId);
}
