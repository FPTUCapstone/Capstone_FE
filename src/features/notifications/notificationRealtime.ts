import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';

const CLIENT_EVENT = 'NotificationsChanged';
const RECONNECT_DELAYS_MS = [0, 2000, 10000, 30000];

export function getNotificationsHubUrl(): string {
  const api = getApiBase();
  const origin = /^https?:\/\//.test(api) ? new URL(api).origin : '';
  return `${origin}/hubs/notifications`;
}

/**
 * Subscribes to `/hubs/notifications` refresh hints for browser-authenticated sessions.
 * Hints only trigger an authorized HTTP refetch; payloads are never treated as truth.
 */
export function subscribeToNotificationChanges(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !AuthStorage.getAccessToken()) {
    return () => undefined;
  }

  const url = getNotificationsHubUrl();
  const isSameOriginProxy = url.startsWith('/');
  const initialUserId = AuthStorage.getContext()?.userId;
  let stopped = false;

  const isSameUser = () =>
    initialUserId === undefined || AuthStorage.getContext()?.userId === initialUserId;

  const connection = new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => (isSameUser() ? AuthStorage.getAccessToken() ?? '' : ''),
      ...(isSameOriginProxy ? { transport: HttpTransportType.LongPolling } : {}),
    })
    .configureLogging(LogLevel.None)
    .withAutomaticReconnect(RECONNECT_DELAYS_MS)
    .build();

  const trigger = () => {
    if (!stopped && isSameUser()) {
      onChange();
    }
  };

  connection.on(CLIENT_EVENT, trigger);
  connection.onreconnected(trigger);
  void connection.start().catch(() => {
    /* Authenticated 30s polling remains active as fallback. */
  });

  return () => {
    stopped = true;
    void connection.stop().catch(() => undefined);
  };
}
