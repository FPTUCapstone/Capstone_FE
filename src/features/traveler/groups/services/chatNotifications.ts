import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';

/** Events invalidate authenticated reads; they are never rendered as trusted message data. */
export function subscribeToChatChanges(userId: number, notify: () => void): () => void {
  const api = getApiBase();
  const origin = /^https?:\/\//.test(api) ? new URL(api).origin : '';
  let stopped = false;
  const connections = ['group-chat', 'direct-chat'].map(name => {
    const c = new HubConnectionBuilder().withUrl(`${origin}/hubs/${name}`, {
      accessTokenFactory: () => AuthStorage.getContext()?.userId === userId ? AuthStorage.getAccessToken() ?? '' : '',
      transport: HttpTransportType.LongPolling,
    }).configureLogging(LogLevel.None).withAutomaticReconnect([1000, 3000, 10000]).build();
    for (const event of ['MessageReceived', 'MessageUpdated', 'ConversationChanged', 'MembershipChanged', 'BroadcastAcknowledged', 'RollCallCheckedIn', 'ExpensePaymentUpdated', 'PollVoteRecorded']) {
      c.on(event, () => { if (!stopped && AuthStorage.getContext()?.userId === userId) notify(); });
    }
    c.onreconnected(() => { if (!stopped) notify(); });
    void c.start().catch(() => { /* Authenticated polling/focus reload remains available. */ });
    return c;
  });
  return () => { stopped = true; for (const c of connections) void c.stop().catch(() => undefined); };
}
