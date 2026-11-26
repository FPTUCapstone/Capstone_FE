import { proxyConsoleInbox } from '@/features/notifications/server/consoleInboxProxy';

export function GET(request: Request) {
  return proxyConsoleInbox(request);
}
