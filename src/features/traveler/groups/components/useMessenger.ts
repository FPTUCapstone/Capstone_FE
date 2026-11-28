'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthRole } from '@/features/auth/session/authSession';
import {
  acknowledgeBroadcastMessage, checkinRollCallMessage, fetchChatMembers, fetchGroupConversations,
  fetchGroupMessages, markGroupRead, postGroupMessage, toggleExpensePaymentStatus, TravelGroupHttpError, votePollOption,
  type ChatMember, type GroupConversation, type GroupMessageApiDto,
} from '../services/travelGroupApi';
import {
  fetchDirectConversations, fetchDirectMessages, markDirectRead, openDirectConversation, sendDirectMessage,
  type DirectConversation, type DirectMessage,
} from '../services/directChatApi';
import { subscribeToChatChanges } from '../services/chatNotifications';
import {
  fetchChatGroupConversations, fetchChatGroupMessages, markChatGroupRead, sendChatGroupMessage,
  type ChatGroupConversation,
} from '../services/chatGroupApi';

export interface Thread {
  key: string; id: number; kind: 'group' | 'direct'; title: string; preview: string | null;
  updatedAt: string | null; unread: number; group?: GroupConversation; direct?: DirectConversation; chatGroup?: boolean; isClosed?: boolean;
}
export type Message = GroupMessageApiDto | DirectMessage;
interface OutboxOperation {
  clientMessageId: string; threadKey: string; type: string; content: string; draftRevision: number; confirmed: boolean;
}
export const groupThread = (g: GroupConversation): Thread => ({ key: `group:${g.groupId}`, id: g.groupId, kind: 'group', title: g.groupName, preview: g.lastMessage, updatedAt: g.lastMessageAtUtc, unread: g.unreadCount ?? 0, group: g });
export const directThread = (d: DirectConversation): Thread => ({ key: `direct:${d.conversationId}`, id: d.conversationId, kind: 'direct', title: d.displayName, preview: d.lastMessage, updatedAt: d.lastMessageAtUtc, unread: d.unreadCount, direct: d });
// Synthetic UI fields identify an independent conversation; they never go to travel APIs.
export const chatGroupThread = (g: ChatGroupConversation): Thread => ({
  key: `chat-group:${g.groupId}`, id: g.groupId, kind: 'group', chatGroup: true, isClosed: g.isClosed === true,
  title: g.groupName, preview: g.lastMessage, updatedAt: g.lastMessageAtUtc, unread: g.unreadCount,
  group: { ...g, itineraryId: 0, itineraryTitle: null, itinerarySourceType: 'Independent', status: g.isClosed ? 'Closed' : 'Active' },
});
interface ListCursors { group: number | null; direct: number | null; chatGroup: number | null }
const mergeMessages = (old: Message[], incoming: Message[]) => {
  const rows = new Map(old.map(m => [m.messageId, m]));
  for (const message of incoming) {
    const previous = rows.get(message.messageId);
    if (previous && 'groupId' in previous && 'groupId' in message && (previous.revision ?? 0) > (message.revision ?? 0)) continue;
    rows.set(message.messageId, message);
  }
  return [...rows.values()].sort((a, b) => a.messageId - b.messageId);
};
export function chatError(error: unknown): string {
  return error instanceof TravelGroupHttpError ? error.message : 'Không thể hoàn tất thao tác. Nội dung của bạn vẫn được giữ lại; vui lòng thử lại.';
}

interface ConversationCursorPage<T> { items: T[]; next: number | null }
async function coverLoadedConversations<T>(head: ConversationCursorPage<T>, minimumLoadedId: number,
  load: (cursor: number) => Promise<ConversationCursorPage<T>>, isCurrent: () => boolean): Promise<ConversationCursorPage<T>> {
  const items = [...head.items];
  let cursor = head.next;
  // Revalidate the already-loaded range so an external leave/removal drops stale threads.
  // Bound a refresh burst; anything beyond the verified range can be loaded again by paging.
  for (let page = 1; page < 20 && cursor !== null && cursor > minimumLoadedId && isCurrent(); page++) {
    const previous = cursor;
    const next = await load(previous);
    if (next.next !== null && next.next >= previous) throw new TravelGroupHttpError(502, 'Phân trang hội thoại không hợp lệ. Vui lòng tải lại.', 'server.invalid_contract');
    items.push(...next.items); cursor = next.next;
  }
  return { items, next: cursor };
}

export function useMessenger(userId: number, role: AuthRole, readable = true, autoSelectFirst = true) {
  const readableRef = useRef(readable);
  useEffect(() => { readableRef.current = readable; }, [readable]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorStatuses, setErrorStatuses] = useState<Record<string, number | undefined>>({});
  const [listError, setListError] = useState<string | null>(null);
  const [listStatus, setListStatus] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [blocked, setBlocked] = useState<Record<string, boolean>>({});
  const [cursors, setCursors] = useState<ListCursors>({ group: null, direct: null, chatGroup: null });
  const alive = useRef(true);
  const active = useRef<Thread | null>(null);
  const threadCache = useRef<Thread[]>([]);
  useEffect(() => { threadCache.current = threads; }, [threads]);
  const epoch = useRef(0);
  const session = useRef(0);
  const owner = useRef({ userId, role });
  const locks = useRef(new Set<string>());
  const retryKeys = useRef(new Map<string, OutboxOperation>());
  const draftRevisions = useRef(new Map<string, number>());
  const listGeneration = useRef(0);
  const listFlight = useRef<{ generation: number; promise: Promise<void> } | null>(null);
  const interactionRevision = useRef(0);
  const interactionChanges = useRef(new Map<number, { revision: number; patch: Partial<GroupMessageApiDto> }>());
  const readCursors = useRef(new Map<string, number>());
  // A synchronized anchor is independent of locally confirmed sends. Sending must not skip an unseen gap.
  const historyAnchor = useRef(0);
  const historyGap = useRef<{ before: number; newest: number; incoming: number } | null>(null);
  const historyFlight = useRef<{ version: number } | null>(null);
  const continuation = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const completeOutbox = useCallback((fingerprint: string, operation: OutboxOperation) => {
    operation.confirmed = true;
    if (retryKeys.current.get(fingerprint) !== operation) return;
    retryKeys.current.delete(fingerprint);
    if (operation.type === 'text' && (draftRevisions.current.get(operation.threadKey) ?? 0) === operation.draftRevision) {
      setDrafts(old => old[operation.threadKey]?.trim() === operation.content ? { ...old, [operation.threadKey]: '' } : old);
    }
  }, []);
  const reconcileOutbox = useCallback((thread: Thread, incoming: Message[]) => {
    for (const message of incoming) {
      if (message.senderUserId !== userId || !('clientMessageId' in message) || typeof message.clientMessageId !== 'string') continue;
      for (const [fingerprint, operation] of retryKeys.current) {
        if (operation.threadKey === thread.key && operation.clientMessageId === message.clientMessageId
          && operation.content === message.content.trim() && (!('messageType' in message) || message.messageType === operation.type)) {
          completeOutbox(fingerprint, operation);
        }
      }
    }
  }, [completeOutbox, userId]);

  const readHistory = useCallback(async (thread: Thread, version: number, mode: 'initial' | 'refresh' | 'older' = 'refresh', before?: number): Promise<void> => {
    const current = () => alive.current && epoch.current === version && active.current?.key === thread.key;
    if (!current() || historyFlight.current?.version === version) return;
    const flight = { version };
    historyFlight.current = flight;
    try {
      let incoming = 0;
      // Yield after at most 500 messages. A continuation retains its descending cursor instead of
      // restarting at the head on every poll; read progress stays behind the gap until it is closed.
      for (let pages = 0; pages < 10; pages++) {
        const cursor = mode === 'refresh' ? historyGap.current?.before : before;
        const revision = interactionRevision.current;
        const result = thread.chatGroup ? await fetchChatGroupMessages(thread.id, cursor)
          : thread.kind === 'group' ? await fetchGroupMessages(thread.id, 50, cursor) : await fetchDirectMessages(thread.id, cursor);
        if (!current()) return;
        reconcileOutbox(thread, result);
        const oldest = result[0]?.messageId;
        const newest = result.at(-1)?.messageId ?? 0;
        incoming = Math.max(incoming, ...result.filter(m => m.senderUserId !== userId).map(m => m.messageId));
        const updated = result.map(message => {
          const change = interactionChanges.current.get(message.messageId);
          return 'groupId' in message && change && change.revision > revision ? { ...message, ...change.patch } : message;
        });
        setMessages(old => mergeMessages(old, updated));
        if (mode !== 'refresh') {
          setHasOlder(result.length === 50);
          if (mode === 'initial') historyAnchor.current = newest;
          break;
        }
        const gap = historyGap.current;
        if (gap) incoming = Math.max(incoming, gap.incoming);
        if (result.length < 50 || oldest === undefined || oldest <= historyAnchor.current) {
          historyAnchor.current = Math.max(historyAnchor.current, gap?.newest ?? newest);
          historyGap.current = null;
          break;
        }
        if (cursor !== undefined && oldest >= cursor) throw new Error('History pagination did not advance.');
        historyGap.current = { before: oldest, newest: gap?.newest ?? newest, incoming };
      }
      if (mode === 'refresh' && historyGap.current) {
        clearTimeout(continuation.current);
        continuation.current = setTimeout(() => {
          if (document.visibilityState !== 'hidden') void readHistory(thread, version);
        }, 200);
        return;
      }
      setBlocked(old => ({ ...old, [thread.key]: false }));
      setErrors(old => ({ ...old, [thread.key]: '' }));
      setErrorStatuses(old => ({ ...old, [thread.key]: undefined }));
      if (readableRef.current && document.visibilityState !== 'hidden' && document.hasFocus()) {
        if (incoming > (readCursors.current.get(thread.key) ?? 0)) {
          const previous = readCursors.current.get(thread.key) ?? 0;
          readCursors.current.set(thread.key, incoming);
          try {
            if (thread.chatGroup) await markChatGroupRead(thread.id, incoming);
            else if (thread.kind === 'direct') await markDirectRead(thread.id, incoming);
            else await markGroupRead(thread.id, incoming);
          } catch (error) { if (current()) readCursors.current.set(thread.key, previous); throw error; }
          if (current()) setThreads(old => old.map(t => t.key === thread.key ? { ...t, unread: 0 } : t));
        }
      }
    } catch (error) {
      if (!alive.current || epoch.current !== version || active.current?.key !== thread.key) return;
      setErrors(old => ({ ...old, [thread.key]: chatError(error) }));
      setErrorStatuses(old => ({ ...old, [thread.key]: error instanceof TravelGroupHttpError ? error.status : undefined }));
      if (error instanceof TravelGroupHttpError && [401, 403, 404].includes(error.status)) { setMessages([]); setMembers([]); setBlocked(old => ({ ...old, [thread.key]: true })); }
    } finally {
      if (historyFlight.current === flight) historyFlight.current = null;
      if (alive.current && epoch.current === version) { setLoadingMessages(false); setLoadingOlder(false); }
    }
  }, [userId, reconcileOutbox]);

  const select = useCallback((thread: Thread) => {
    const version = ++epoch.current;
    clearTimeout(continuation.current); historyAnchor.current = 0; historyGap.current = null;
    interactionChanges.current.clear();
    active.current = thread;
    setSelected(thread); setMessages([]); setMembers([]); setHasOlder(false); setLoadingOlder(false); setLoadingMessages(true);
    void readHistory(thread, version, 'initial');
    if (!thread.chatGroup && thread.kind === 'group' && thread.group?.status !== 'Closed') void fetchChatMembers(thread.id).then(rows => {
      if (alive.current && epoch.current === version) setMembers(rows);
    }).catch(() => { /* Missing membership data disables expense creation; never substitute fake members. */ });
  }, [readHistory]);

  const openChatGroup = useCallback((group: ChatGroupConversation): void => {
    if (!alive.current) return;
    const row = chatGroupThread(group);
    setThreads(old => [row, ...old.filter(t => t.key !== row.key)]);
    select(row);
  }, [select]);

  const refreshLists = useCallback((more?: ListCursors): Promise<void> => {
    // Polls join an existing list request instead of invalidating a slower pagination response.
    if (listFlight.current?.generation === listGeneration.current) return listFlight.current.promise;
    if (more && more.group === null && more.direct === null && more.chatGroup === null) return Promise.resolve();
    const generation = ++listGeneration.current;
    const canUseGroups = role === 'Traveler' || role === 'TourOperator';
    const promise = (async () => {
    try {
      let [groups, direct, chatGroups] = await Promise.all([
        canUseGroups && (!more || more.group !== null) ? fetchGroupConversations(more?.group ?? undefined) : Promise.resolve({ items: [], nextBeforeGroupId: null }),
        !more || more.direct !== null ? fetchDirectConversations(more?.direct ?? undefined) : Promise.resolve({ items: [], nextBeforeConversationId: null }),
        !more || more.chatGroup !== null ? fetchChatGroupConversations(more?.chatGroup ?? undefined) : Promise.resolve({ items: [], nextBeforeGroupId: null }),
      ]);
      if (!alive.current || generation !== listGeneration.current) return;
      if (!more) {
        const loaded = threadCache.current;
        const minimum = (kind: 'travel' | 'direct' | 'chat') => Math.min(...loaded.filter(thread =>
          kind === 'direct' ? thread.kind === 'direct' : thread.kind === 'group' && !!thread.chatGroup === (kind === 'chat')).map(thread => thread.id));
        const current = () => alive.current && generation === listGeneration.current;
        const [travelPage, directPage, chatPage] = await Promise.all([
          coverLoadedConversations({ items: groups.items, next: groups.nextBeforeGroupId }, minimum('travel'), async cursor => {
            const page = await fetchGroupConversations(cursor); return { items: page.items, next: page.nextBeforeGroupId };
          }, current),
          coverLoadedConversations({ items: direct.items, next: direct.nextBeforeConversationId }, minimum('direct'), async cursor => {
            const page = await fetchDirectConversations(cursor); return { items: page.items, next: page.nextBeforeConversationId };
          }, current),
          coverLoadedConversations({ items: chatGroups.items, next: chatGroups.nextBeforeGroupId }, minimum('chat'), async cursor => {
            const page = await fetchChatGroupConversations(cursor); return { items: page.items, next: page.nextBeforeGroupId };
          }, current),
        ]);
        if (!current()) return;
        groups = { items: travelPage.items, nextBeforeGroupId: travelPage.next };
        direct = { items: directPage.items, nextBeforeConversationId: directPage.next };
        chatGroups = { items: chatPage.items, nextBeforeGroupId: chatPage.next };
      }
      const rows = [...groups.items.map(groupThread), ...direct.items.map(directThread), ...chatGroups.items.map(chatGroupThread)];
      setThreads(old => Array.from(new Map([...(more ? old : []), ...rows].map(t => [t.key, t])).values()));
      setCursors({ group: groups.nextBeforeGroupId, direct: direct.nextBeforeConversationId, chatGroup: chatGroups.nextBeforeGroupId });
      setListError(null);
      setListStatus(undefined);
      if (autoSelectFirst && !active.current && rows.length) select(rows[0]);
      else if (active.current && !more) {
        const current = rows.find(t => t.key === active.current?.key);
        if (current) { active.current = current; setSelected(current); }
        // A selected conversation may belong to a later page; the authorized history read determines access.
      }
    } catch (error) { if (alive.current && generation === listGeneration.current) { setListError(chatError(error)); setListStatus(error instanceof TravelGroupHttpError ? error.status : undefined); } }
    finally {
      if (listFlight.current?.generation === generation) listFlight.current = null;
      if (alive.current && generation === listGeneration.current) setLoading(false);
    }
    })();
    listFlight.current = { generation, promise };
    return promise;
  }, [role, select, autoSelectFirst]);

  useEffect(() => {
    alive.current = true;
    if (owner.current.userId !== userId || owner.current.role !== role) {
      owner.current = { userId, role };
      active.current = null; threadCache.current = [];
      historyAnchor.current = 0; historyGap.current = null; interactionChanges.current.clear();
      locks.current = new Set(); retryKeys.current.clear(); draftRevisions.current.clear(); readCursors.current.clear();
      setThreads([]); setSelected(null); setMessages([]); setMembers([]); setDrafts({});
      setErrors({}); setErrorStatuses({}); setListError(null); setListStatus(undefined);
      setPending({}); setBlocked({}); setCursors({ group: null, direct: null, chatGroup: null });
      setLoading(true); setLoadingMessages(false); setLoadingOlder(false); setHasOlder(false);
    }
    const lifecycle = epoch;
    const sessionLifecycle = session;
    const listLifecycle = listGeneration;
    void refreshLists();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (!alive.current || document.visibilityState === 'hidden') return;
        void refreshLists();
        if (active.current && !locks.current.has(active.current.key)) void readHistory(active.current, epoch.current);
      }, 200);
    };
    const unsubscribe = subscribeToChatChanges(userId, update);
    const poll = setInterval(update, 15000);
    window.addEventListener('focus', update); document.addEventListener('visibilitychange', update);
    return () => { alive.current = false; lifecycle.current++; sessionLifecycle.current++; listLifecycle.current++; clearTimeout(continuation.current); clearTimeout(timer); clearInterval(poll); unsubscribe(); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, [readHistory, refreshLists, role, userId]);

  const perform = async <T,>(thread: Thread, operation: () => Promise<T>): Promise<T> => {
    const version = session.current;
    const operationLocks = locks.current;
    if (operationLocks.has(thread.key)) throw new Error('An operation is already pending.');
    operationLocks.add(thread.key); setPending(old => ({ ...old, [thread.key]: true }));
    setErrors(old => ({ ...old, [thread.key]: '' }));
    setErrorStatuses(old => ({ ...old, [thread.key]: undefined }));
    try { return await operation(); }
    catch (error) { if (alive.current && session.current === version) { setErrors(old => ({ ...old, [thread.key]: chatError(error) })); setErrorStatuses(old => ({ ...old, [thread.key]: error instanceof TravelGroupHttpError ? error.status : undefined })); } throw error; }
    finally { operationLocks.delete(thread.key); if (alive.current && session.current === version) setPending(old => ({ ...old, [thread.key]: false })); }
  };

  const send = async (type: string, content: string, metadata?: object) => {
    const thread = active.current;
    if (!thread || thread.isClosed || thread.group?.status === 'Closed' || !content.trim() || content.trim().length > 4000 || locks.current.has(thread.key)) return false;
    if (thread.chatGroup && type !== 'text') return false;
    const version = epoch.current;
    const sessionVersion = session.current;
    const fingerprint = `${thread.key}:${JSON.stringify({ type, content: content.trim(), metadata })}`;
    const operation = retryKeys.current.get(fingerprint) ?? { clientMessageId: crypto.randomUUID(), threadKey: thread.key,
      type, content: content.trim(), draftRevision: draftRevisions.current.get(thread.key) ?? 0, confirmed: false };
    operation.draftRevision = draftRevisions.current.get(thread.key) ?? 0;
    const clientMessageId = operation.clientMessageId;
    retryKeys.current.set(fingerprint, operation);
    try {
      const result = await perform<Message>(thread, () => thread.chatGroup
        ? sendChatGroupMessage(thread.id, content.trim(), clientMessageId)
        : thread.kind === 'group'
        ? postGroupMessage(thread.id, { messageType: type, content: content.trim(), ...(metadata ? { metadataJson: JSON.stringify(metadata) } : {}), clientMessageId })
        : sendDirectMessage(thread.id, content.trim(), clientMessageId));
      if (!alive.current || session.current !== sessionVersion) return false;
      completeOutbox(fingerprint, operation);
      if (epoch.current === version && active.current?.key === thread.key) setMessages(old => mergeMessages(old, [result]));
      setThreads(old => old.map(t => t.key === thread.key ? { ...t, preview: `Bạn: ${result.content}`, updatedAt: result.createdAtUtc } : t));
      return true;
    } catch {
      if (alive.current && session.current === sessionVersion && operation.confirmed) {
        setErrors(old => ({ ...old, [thread.key]: '' })); setErrorStatuses(old => ({ ...old, [thread.key]: undefined }));
        return true;
      }
      return false;
    }
  };
  const interact = async (message: GroupMessageApiDto, action: 'read' | 'present' | 'paid' | 'vote', optionIndex?: number) => {
    const thread = active.current;
    if (!thread || thread.chatGroup || thread.kind !== 'group' || message.groupId !== thread.id || locks.current.has(thread.key)) return;
    const version = epoch.current;
    try {
      const result = await perform<unknown>(thread, () => action === 'read' ? acknowledgeBroadcastMessage(thread.id, message.messageId, message.revision ?? 0)
        : action === 'present' ? checkinRollCallMessage(thread.id, message.messageId)
        : action === 'paid' ? toggleExpensePaymentStatus(thread.id, message.messageId, true, message.revision ?? 0)
        : votePollOption(thread.id, message.messageId, optionIndex!, message.revision ?? 0));
      if (alive.current && epoch.current === version && active.current?.key === thread.key) {
        const patch: Partial<GroupMessageApiDto> = action === 'read' ? { isReadByMe: true, readByCount: result as number }
            : action === 'present' ? { isPresentByMe: true, presentCount: result as number }
            : action === 'paid' ? { paidUserIds: result as number[] }
            : { myPollVoteOption: optionIndex === -1 ? null : optionIndex, pollVoteCounts: result as Record<number, number> };
        const previous = interactionChanges.current.get(message.messageId)?.patch;
        const combined = { ...previous, ...patch };
        interactionChanges.current.set(message.messageId, { revision: ++interactionRevision.current, patch: combined });
        setMessages(old => old.map(m => 'groupId' in m && m.messageId === message.messageId ? { ...m, ...combined } : m));
      }
    } catch { /* The per-thread error is already displayed. */ }
  };
  const openDirect = async (otherUserId: number, signal?: AbortSignal) => {
    const version = epoch.current;
    const sessionVersion = session.current;
    const row = directThread(await openDirectConversation(otherUserId));
    if (!alive.current || session.current !== sessionVersion) return;
    setThreads(old => [row, ...old.filter(t => t.key !== row.key)]);
    if (!signal?.aborted && epoch.current === version) select(row);
  };
  const loadOlder = () => {
    if (!active.current || loadingOlder || !messages.length || historyFlight.current?.version === epoch.current) return;
    if (historyGap.current) { void readHistory(active.current, epoch.current); return; }
    setLoadingOlder(true); void readHistory(active.current, epoch.current, 'older', messages[0].messageId);
  };
  const applyEditedMessage = (message: GroupMessageApiDto) => {
    const thread = active.current;
    if (!thread || thread.chatGroup || thread.kind !== 'group' || thread.id !== message.groupId) return;
    interactionChanges.current.set(message.messageId, { revision: ++interactionRevision.current, patch: message });
    setMessages(old => old.map(m => m.messageId === message.messageId ? message : m));
  };
  const forgetThread = (threadKey: string) => {
    listGeneration.current += 1;
    setThreads(old => old.filter(thread => thread.key !== threadKey));
    setDrafts(old => { const next = { ...old }; delete next[threadKey]; return next; });
    readCursors.current.delete(threadKey);
    for (const [fingerprint, operation] of retryKeys.current) {
      if (operation.threadKey === threadKey) retryKeys.current.delete(fingerprint);
    }
    if (active.current?.key !== threadKey) return;
    epoch.current += 1; active.current = null;
    clearTimeout(continuation.current); historyFlight.current = null;
    historyAnchor.current = 0; historyGap.current = null; interactionChanges.current.clear();
    setSelected(null); setMessages([]); setMembers([]); setHasOlder(false);
    setLoadingMessages(false); setLoadingOlder(false);
  };
  return { threads, selected, select, forgetThread, messages, members, loading, loadingMessages, loadingOlder, hasOlder, loadOlder, listError,
    refresh: () => refreshLists(), loadMoreThreads: () => refreshLists(cursors), hasMoreThreads: cursors.group !== null || cursors.direct !== null || cursors.chatGroup !== null,
    error: selected ? errors[selected.key] : null, busy: selected ? !!pending[selected.key] : false, blocked: selected ? !!blocked[selected.key] : false,
    needsSignIn: (selected ? errorStatuses[selected.key] : undefined) === 401 || listStatus === 401,
    draft: selected ? drafts[selected.key] ?? '' : '', setDraft: (value: string) => { if (selected) {
      draftRevisions.current.set(selected.key, (draftRevisions.current.get(selected.key) ?? 0) + 1);
      setDrafts(old => ({ ...old, [selected.key]: value }));
    } },
    send, interact, openDirect, openChatGroup, applyEditedMessage,
  };
}
