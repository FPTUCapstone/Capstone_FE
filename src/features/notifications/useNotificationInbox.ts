import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotificationInbox, markNotificationRead, NotificationsApiError } from './notificationsApi';
import { subscribeToNotificationChanges } from './notificationRealtime';
import type { NotificationInboxItem } from './types';

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 30000;
const EMPTY_INBOX = { items: [] as readonly NotificationInboxItem[], nextBeforeId: null as number | null };

export function useNotificationInbox({ enabled = true, consoleSessionKey }: {
  enabled?: boolean;
  consoleSessionKey?: number;
} = {}) {
  const [inbox, setInbox] = useState(EMPTY_INBOX);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const controller = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const readInSession = useRef(new Set<number>());
  const requestInFlight = useRef(false);
  const pendingRealtimeRefresh = useRef(false);
  const hasLoadedMore = useRef(false);
  const unreadOverflow = useRef(false);
  const sessionUnavailable = useRef(false);
  const refreshRef = useRef<(beforeId?: number, polling?: boolean) => Promise<void>>(async () => undefined);

  const reportError = useCallback((failure: unknown) => {
    if (failure instanceof NotificationsApiError && [401, 403].includes(failure.status)) {
      sessionUnavailable.current = true;
      setInbox(EMPTY_INBOX);
      setUnreadCount(0);
    }
    setError(failure instanceof NotificationsApiError ? failure.message : 'Không thể tải thông báo. Vui lòng thử lại.');
  }, []);

  const refresh = useCallback(async (beforeId?: number, polling = false) => {
    const signal = controller.current?.signal;
    if (!signal || signal.aborted || (polling && (requestInFlight.current || sessionUnavailable.current))) return;
    const request = ++revision.current;
    requestInFlight.current = true;
    if (!polling) setLoading(true);
    const preservePages = polling && hasLoadedMore.current;
    try {
      const [page, unread] = await Promise.all([
        getNotificationInbox({ limit: PAGE_SIZE, beforeId, unreadOnly, signal, consoleSessionKey }),
        getNotificationInbox({ limit: 11, unreadOnly: true, signal, consoleSessionKey }),
      ]);
      if (signal.aborted || revision.current !== request) return;
      const items = page.items
          .map((item) => readInSession.current.has(item.id) ? { ...item, isRead: true } : item)
          .filter((item) => !unreadOnly || !item.isRead);
      const oldestFetchedId = page.items.at(-1)?.id;
      const canKeepTail = preservePages && page.nextBeforeId !== null && oldestFetchedId !== undefined;
      if (!canKeepTail) hasLoadedMore.current = Boolean(beforeId);
      setInbox((current) => {
        if (canKeepTail && current.items.some((item) => item.id === oldestFetchedId)) {
          return { items: [...items, ...current.items.filter((item) => item.id < oldestFetchedId)],
            nextBeforeId: current.nextBeforeId };
        }
        return { items: beforeId ? [...current.items, ...items] : items, nextBeforeId: page.nextBeforeId };
      });
      unreadOverflow.current = unread.nextBeforeId !== null;
      const unreadVisible = unread.items.filter((item) => !readInSession.current.has(item.id)).length;
      setUnreadCount(Math.max(unreadVisible, unreadOverflow.current ? 10 : 0));
      sessionUnavailable.current = false;
      setError(null);
    } catch (failure) {
      if (!signal.aborted && revision.current === request) reportError(failure);
    } finally {
      if (!signal.aborted && revision.current === request) {
        requestInFlight.current = false;
        setLoading(false);
        if (pendingRealtimeRefresh.current && !sessionUnavailable.current) {
          pendingRealtimeRefresh.current = false;
          void Promise.resolve().then(() => {
            if (!signal.aborted) return refreshRef.current(undefined, true);
          });
        }
      }
    }
  }, [consoleSessionKey, reportError, unreadOnly]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const scope = new AbortController();
    controller.current = scope;
    hasLoadedMore.current = false;
    pendingRealtimeRefresh.current = false;
    void Promise.resolve().then(() => {
      if (!scope.signal.aborted) return refresh();
    });
    const unsubscribeRealtime = consoleSessionKey === undefined
      ? subscribeToNotificationChanges(() => {
          if (scope.signal.aborted || sessionUnavailable.current) return;
          if (requestInFlight.current) {
            pendingRealtimeRefresh.current = true;
            return;
          }
          void refresh(undefined, true);
        })
      : undefined;
    const interval = setInterval(() => void refresh(undefined, true), POLL_INTERVAL_MS);
    return () => {
      scope.abort();
      pendingRealtimeRefresh.current = false;
      clearInterval(interval);
      unsubscribeRealtime?.();
    };
  }, [consoleSessionKey, enabled, refresh]);

  const markRead = useCallback(async (notificationId: number) => {
    const signal = controller.current?.signal;
    if (!signal || signal.aborted) return;
    try {
      await markNotificationRead(notificationId, { signal, consoleSessionKey });
      if (signal.aborted) return;
      if (!readInSession.current.has(notificationId)) {
        readInSession.current.add(notificationId);
        setInbox((current) => ({
          ...current,
          items: unreadOnly
            ? current.items.filter((item) => item.id !== notificationId)
            : current.items.map((item) => item.id === notificationId ? { ...item, isRead: true } : item),
        }));
        setUnreadCount((count) => Math.max(unreadOverflow.current ? 10 : 0, count - 1));
      }
      setError(null);
      return true;
    } catch (failure) {
      if (!signal.aborted) reportError(failure);
    }
  }, [consoleSessionKey, reportError, unreadOnly]);

  return {
    items: enabled ? inbox.items : EMPTY_INBOX.items,
    unreadCount: enabled ? unreadCount : 0,
    unreadOnly,
    setUnreadOnly: (value: boolean) => {
      setInbox(EMPTY_INBOX);
      setUnreadOnly(value);
    },
    error,
    loading,
    refresh: () => refresh(),
    loadMore: inbox.nextBeforeId === null ? undefined : () => refresh(inbox.nextBeforeId ?? undefined),
    markRead,
  };
}
