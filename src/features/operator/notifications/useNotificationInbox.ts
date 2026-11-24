import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotificationInbox, markNotificationRead } from './notificationsApi';
import type { NotificationInboxItem } from './types';

const POLL_INTERVAL_MS = 30000;

export interface UseNotificationInboxOptions {
  enabled?: boolean;
}

export interface UseNotificationInboxResult {
  items: readonly NotificationInboxItem[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
}

export function useNotificationInbox(
  options?: UseNotificationInboxOptions
): UseNotificationInboxResult {
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<readonly NotificationInboxItem[]>([]);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await getNotificationInbox({ limit: 20 });
      setItems(response.items);
    } catch {
      // The inbox is only a hint, so a failed read leaves the previous state in place.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    // The inbox is only a hint, so a failed read leaves the previous state in place.
    getNotificationInbox({ limit: 20 })
      .then((response) => {
        if (active) setItems(response.items);
      })
      .catch(() => {});

    pollingIntervalRef.current = setInterval(() => {
      if (!active) return;
      getNotificationInbox({ limit: 20 })
        .then((response) => {
          if (active) setItems(response.items);
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled]);

  const markRead = useCallback(async (notificationId: number) => {
    try {
      await markNotificationRead(notificationId);
      setItems((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
    } catch {
      // Marking read is only a hint for the badge; a failed request leaves the item unread
      // so the user can retry, instead of surfacing an unhandled rejection from a stray click.
    }
  }, []);

  const unreadCount = items.filter((item) => !item.isRead).length;

  return { items, unreadCount, refresh, markRead };
}
