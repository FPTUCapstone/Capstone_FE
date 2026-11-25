import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { GroupConversation, GroupMessageApiDto } from '../services/travelGroupApi';

const api = vi.hoisted(() => ({
  groups: vi.fn(), direct: vi.fn(), history: vi.fn(), directHistory: vi.fn(), members: vi.fn(),
  post: vi.fn(), directPost: vi.fn(), read: vi.fn(), directRead: vi.fn(),
  acknowledge: vi.fn(), present: vi.fn(), paid: vi.fn(), vote: vi.fn(),
  notify: null as (() => void) | null,
}));
vi.mock('../services/travelGroupApi', async original => ({
  ...(await original<object>()), fetchGroupConversations: api.groups, fetchGroupMessages: api.history,
  fetchChatMembers: api.members, postGroupMessage: api.post, markGroupRead: api.read,
  acknowledgeBroadcastMessage: api.acknowledge, checkinRollCallMessage: api.present,
  toggleExpensePaymentStatus: api.paid, votePollOption: api.vote,
}));
vi.mock('../services/directChatApi', async original => ({
  ...(await original<object>()), fetchDirectConversations: api.direct, fetchDirectMessages: api.directHistory,
  sendDirectMessage: api.directPost, markDirectRead: api.directRead,
}));
vi.mock('../services/chatNotifications', () => ({
  subscribeToChatChanges: (_userId: number, notify: () => void) => { api.notify = notify; return () => { api.notify = null; }; },
}));
import { groupThread, useMessenger } from '../components/useMessenger';
import { TravelGroupHttpError } from '../services/travelGroupApi';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const group = (id: number): GroupConversation => ({
  groupId: id, groupName: `Group ${id}`, itineraryId: id, itineraryTitle: null, itinerarySourceType: 'Manual',
  hostUserId: 42, memberCount: 2, status: 'Active', lastMessage: null, lastMessageAtUtc: null, unreadCount: 0,
});
const message = (id: number, extra: Partial<GroupMessageApiDto> = {}): GroupMessageApiDto => ({
  messageId: id, groupId: 1, senderUserId: 43, senderName: 'Member', messageType: 'text', content: `Message ${id}`,
  createdAtUtc: '2026-11-24T00:00:00Z', readByCount: 0, isReadByMe: false, presentCount: 0,
  isPresentByMe: false, paidUserIds: [], pollVoteCounts: {}, myPollVoteOption: null, ...extra,
});
const page = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => message(from + i));
beforeEach(() => {
  vi.resetAllMocks();
  api.groups.mockResolvedValue({ items: [group(1)], nextBeforeGroupId: null });
  api.direct.mockResolvedValue({ items: [], nextBeforeConversationId: null });
  api.history.mockResolvedValue([]); api.directHistory.mockResolvedValue([]); api.members.mockResolvedValue([]);
  api.read.mockResolvedValue(undefined); api.directRead.mockResolvedValue(undefined);
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

it('keeps a server-confirmed send when the initial history snapshot arrives later', async () => {
  const initial = deferred<GroupMessageApiDto[]>(); api.history.mockReturnValueOnce(initial.promise);
  api.post.mockResolvedValue(message(101, { senderUserId: 42 }));
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.selected?.id).toBe(1));
  act(() => result.current.setDraft('Message 101'));
  await act(async () => { expect(await result.current.send('text', 'Message 101')).toBe(true); });
  await act(async () => initial.resolve([message(100)]));
  expect(result.current.messages.map(m => m.messageId)).toEqual([100, 101]);
  expect(result.current.draft).toBe('');
});

it('preserves loaded conversation pages and their frontier during a background refresh', async () => {
  api.groups.mockImplementation(async (before?: number) => before === 51
    ? { items: [group(50)], nextBeforeGroupId: 50 }
    : before === 50 ? { items: [group(49)], nextBeforeGroupId: null }
      : { items: Array.from({ length: 50 }, (_, i) => group(100 - i)), nextBeforeGroupId: 51 });
  api.direct.mockImplementation(async (before?: number) => ({
    items: [{ conversationId: before ? 9 : 10, otherUserId: 43, displayName: 'Member', avatarUrl: null,
      lastMessage: null, lastMessageAtUtc: null, unreadCount: 0 }], nextBeforeConversationId: before ? null : 10,
  }));
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => result.current.loadMoreThreads());
  await act(async () => result.current.refresh());
  expect(result.current.threads.map(t => t.key)).toContain('group:50');
  expect(result.current.threads.map(t => t.key)).toContain('direct:9');
  api.groups.mockClear(); api.direct.mockClear();
  await act(async () => result.current.loadMoreThreads());
  expect(api.groups).toHaveBeenCalledWith(50);
  expect(api.direct).not.toHaveBeenCalled();
  expect(result.current.threads.map(t => t.key)).toContain('group:49');
  expect(result.current.hasMoreThreads).toBe(false);
});

it.each(['read', 'present', 'paid', 'vote'] as const)('applies authoritative %s results to a message outside the latest page', async action => {
  const older = message(1, { messageType: action === 'vote' ? 'poll' : action === 'paid' ? 'split_bill' : action === 'read' ? 'broadcast' : 'roll_call' });
  api.history.mockImplementation(async (_id: number, _limit: number, before?: number) => before ? [older] : page(51, 100));
  api.acknowledge.mockResolvedValue(4); api.present.mockResolvedValue(3);
  api.paid.mockResolvedValue([42, 43]); api.vote.mockResolvedValue({ 0: 2 });
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.hasOlder).toBe(true));
  await act(async () => result.current.loadOlder());
  await act(async () => result.current.interact(older, action, 0));
  expect(result.current.messages[0]).toMatchObject(action === 'read' ? { isReadByMe: true, readByCount: 4 }
    : action === 'present' ? { isPresentByMe: true, presentCount: 3 }
      : action === 'paid' ? { paidUserIds: [42, 43] } : { myPollVoteOption: 0, pollVoteCounts: { 0: 2 } });
  if (action === 'vote') {
    api.vote.mockResolvedValue({});
    await act(async () => result.current.interact(older, 'vote', -1));
    expect(result.current.messages[0]).toMatchObject({ myPollVoteOption: null, pollVoteCounts: {} });
  }
});

async function notify() {
  await act(async () => { api.notify?.(); await vi.advanceTimersByTimeAsync(200); });
}

it.each(['group', 'direct'] as const)('catches up every missing %s history page before marking the latest incoming message read', async kind => {
  if (kind === 'direct') {
    api.groups.mockResolvedValue({ items: [], nextBeforeGroupId: null });
    api.direct.mockResolvedValue({ items: [{ conversationId: 1, otherUserId: 43, displayName: 'Member', avatarUrl: null,
      lastMessage: null, lastMessageAtUtc: null, unreadCount: 0 }], nextBeforeConversationId: null });
  }
  const middle = deferred<GroupMessageApiDto[]>();
  const history = kind === 'group' ? api.history : api.directHistory;
  const markRead = kind === 'group' ? api.read : api.directRead;
  history.mockResolvedValueOnce([message(1)]).mockResolvedValueOnce(page(102, 151))
    .mockReturnValueOnce(middle.promise).mockResolvedValueOnce(page(2, 51)).mockResolvedValueOnce([message(1)]);
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  markRead.mockClear(); vi.useFakeTimers();
  await notify();
  expect(history).toHaveBeenCalledTimes(3);
  expect(markRead).not.toHaveBeenCalled();
  await notify(); // Another notification must not restart the in-progress traversal at the head.
  expect(history).toHaveBeenCalledTimes(3);
  await act(async () => middle.resolve(page(52, 101)));
  expect(result.current.messages.map(m => m.messageId)).toEqual(Array.from({ length: 151 }, (_, i) => i + 1));
  expect(markRead).toHaveBeenCalledWith(1, 151);
  const beforeIds = history.mock.calls.slice(1).map(args => kind === 'group' ? args[2] : args[1]);
  expect(beforeIds).toEqual([undefined, 102, 52, 2]);
});

it('does not publish a send response into a later visit to the same thread', async () => {
  const send = deferred<GroupMessageApiDto>(); api.post.mockReturnValueOnce(send.promise);
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => { expect(result.current.selected?.id).toBe(1); expect(result.current.loadingMessages).toBe(false); });
  let sending!: Promise<boolean>;
  act(() => { sending = result.current.send('text', 'Message 101'); });
  act(() => result.current.select(groupThread(group(2))));
  act(() => result.current.select(groupThread(group(1))));
  await act(async () => { send.resolve(message(101)); await sending; });
  expect(result.current.messages).toEqual([]);
});

it.each([401, 403, 503])('exposes needsSignIn only for HTTP 401 (received %s)', async status => {
  api.history.mockRejectedValue(new TravelGroupHttpError(status, 'Request failed'));
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.error).toBe('Request failed'));
  expect(result.current).toHaveProperty('needsSignIn', status === 401);
});

it.each([false, true])('reconciles only a known lost-response nonce, preserving newer draft edits: %s', async edited => {
  api.history.mockResolvedValueOnce([]);
  api.post.mockRejectedValueOnce(new TravelGroupHttpError(503, 'Lost response'));
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => { expect(result.current.selected?.id).toBe(1); expect(result.current.loadingMessages).toBe(false); });
  act(() => result.current.setDraft('Original'));
  await act(async () => { expect(await result.current.send('text', 'Original')).toBe(false); });
  const nonce = api.post.mock.calls[0][1].clientMessageId;
  expect(nonce).not.toBe('unknown-operation');
  expect(result.current.draft).toBe('Original');
  if (edited) {
    act(() => result.current.setDraft('Changed'));
    act(() => result.current.setDraft('Original')); // Same text, but a newer draft revision.
  }
  api.history.mockResolvedValue([message(101, { senderUserId: 42, content: 'Original', clientMessageId: 'unknown-operation' })]);
  vi.useFakeTimers(); await notify();
  expect(result.current.draft).toBe('Original');
  api.history.mockResolvedValue([message(101, { senderUserId: 42, content: 'Original', clientMessageId: nonce })]);
  await notify();
  expect(result.current.draft).toBe(edited ? 'Original' : '');
  api.post.mockResolvedValue(message(102, { senderUserId: 42, content: 'Original' }));
  await act(async () => { await result.current.send('text', 'Original'); });
  expect(api.post.mock.calls[1][1].clientMessageId).not.toBe(nonce);
});

it('keeps a pending pagination response when a background list refresh overlaps it', async () => {
  const nextPage = deferred<{ items: GroupConversation[]; nextBeforeGroupId: number | null }>();
  api.groups.mockResolvedValueOnce({ items: [group(100)], nextBeforeGroupId: 100 }).mockReturnValueOnce(nextPage.promise)
    .mockResolvedValue({ items: [group(100)], nextBeforeGroupId: 100 });
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.hasMoreThreads).toBe(true));
  let more!: Promise<void>;
  act(() => { more = result.current.loadMoreThreads(); });
  let refresh!: Promise<void>;
  act(() => { refresh = result.current.refresh(); });
  await act(async () => { nextPage.resolve({ items: [group(99)], nextBeforeGroupId: null }); await Promise.all([more, refresh]); });
  expect(result.current.threads.map(t => t.key)).toContain('group:99');
  expect(result.current.hasMoreThreads).toBe(false);
});

it('does not let a stale history snapshot undo an authoritative interaction', async () => {
  const poll = message(1, { messageType: 'poll' });
  const stale = deferred<GroupMessageApiDto[]>();
  api.history.mockResolvedValueOnce([poll]).mockReturnValueOnce(stale.promise);
  api.vote.mockResolvedValue({ 0: 1 });
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  vi.useFakeTimers(); await notify();
  await act(async () => result.current.interact(poll, 'vote', 0));
  await act(async () => stale.resolve([poll]));
  expect(result.current.messages[0]).toMatchObject({ myPollVoteOption: 0, pollVoteCounts: { 0: 1 } });
});

it('isolates pending sends, drafts and list state when the hook owner changes', async () => {
  const sent = deferred<GroupMessageApiDto>(); api.post.mockReturnValueOnce(sent.promise);
  const { result, rerender } = renderHook(({ userId }) => useMessenger(userId, 'Traveler'), { initialProps: { userId: 42 } });
  await waitFor(() => { expect(result.current.selected?.id).toBe(1); expect(result.current.loadingMessages).toBe(false); });
  act(() => result.current.setDraft('Same text'));
  let sending!: Promise<boolean>;
  act(() => { sending = result.current.send('text', 'Same text'); });
  rerender({ userId: 44 });
  await waitFor(() => { expect(result.current.selected?.id).toBe(1); expect(result.current.busy).toBe(false); });
  expect(result.current.draft).toBe('');
  act(() => result.current.setDraft('Same text'));
  await act(async () => { sent.resolve(message(101, { senderUserId: 42, content: 'Same text' })); await sending; });
  expect(result.current.messages).toEqual([]);
  expect(result.current.draft).toBe('Same text');
  expect(result.current.selected?.preview).toBeNull();
});

it('abandons a pending catch-up after navigation and never reads its gap', async () => {
  const middle = deferred<GroupMessageApiDto[]>();
  api.history.mockResolvedValueOnce([message(1)]).mockResolvedValueOnce(page(102, 151)).mockReturnValueOnce(middle.promise);
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  api.read.mockClear(); vi.useFakeTimers(); await notify();
  api.history.mockResolvedValueOnce([message(7, { groupId: 2 })]);
  await act(async () => result.current.select(groupThread(group(2))));
  await act(async () => middle.resolve(page(52, 101)));
  expect(result.current.messages.map(m => m.messageId)).toEqual([7]);
  expect(api.read.mock.calls).toEqual([[2, 7]]);
  expect(api.history).toHaveBeenCalledTimes(4);
});

it('yields a long catch-up in bounded batches without advancing read progress across its gap', async () => {
  api.history.mockResolvedValueOnce([message(1)]).mockImplementation(async (_id: number, _limit: number, before?: number) => {
    const last = before === undefined ? 1101 : before - 1;
    return page(Math.max(1, last - 49), last);
  });
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  api.read.mockClear(); vi.useFakeTimers(); await notify();
  expect(api.history).toHaveBeenCalledTimes(11); // Initial snapshot plus one bounded batch.
  expect(api.read).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(result.current.messages).toHaveLength(1101);
  expect(api.read).toHaveBeenCalledWith(1, 1101);
});

it('resumes a failed catch-up from its gap cursor without prematurely marking it read', async () => {
  api.history.mockResolvedValueOnce([message(1)]).mockResolvedValueOnce(page(102, 151))
    .mockRejectedValueOnce(new TravelGroupHttpError(503, 'Offline')).mockResolvedValueOnce(page(52, 101))
    .mockResolvedValueOnce(page(2, 51)).mockResolvedValueOnce([message(1)]);
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  api.read.mockClear(); vi.useFakeTimers(); await notify();
  expect(result.current.error).toBe('Offline'); expect(api.read).not.toHaveBeenCalled();
  await notify();
  expect(api.history.mock.calls[3]).toEqual([1, 50, 102]);
  expect(result.current.messages).toHaveLength(151);
  expect(api.read).toHaveBeenCalledWith(1, 151);
});

it('does not let a continuous notification burst postpone authorized reads indefinitely', async () => {
  api.history.mockResolvedValueOnce([message(1)]).mockResolvedValue([message(1), message(2)]);
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  vi.useFakeTimers();
  await act(async () => { api.notify?.(); await vi.advanceTimersByTimeAsync(100); api.notify?.(); await vi.advanceTimersByTimeAsync(100); });
  expect(result.current.messages.map(m => m.messageId)).toEqual([1, 2]);
});

it('pauses an automatic catch-up continuation while hidden and resumes on focus', async () => {
  api.history.mockResolvedValueOnce([message(1)]).mockImplementation(async (_id: number, _limit: number, before?: number) => {
    const last = before === undefined ? 601 : before - 1;
    return page(Math.max(1, last - 49), last);
  });
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  api.read.mockClear(); vi.useFakeTimers(); await notify();
  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(api.history).toHaveBeenCalledTimes(11); expect(api.read).not.toHaveBeenCalled();
  visibility.mockReturnValue('visible'); await notify();
  expect(result.current.messages).toHaveLength(601);
  expect(api.read).toHaveBeenCalledWith(1, 601);
});

it('clears forbidden history without marking its gap read or losing the unsent draft', async () => {
  api.history.mockResolvedValueOnce([message(1)]).mockResolvedValueOnce(page(102, 151))
    .mockRejectedValueOnce(new TravelGroupHttpError(403, 'Membership removed'));
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  act(() => result.current.setDraft('Keep my draft'));
  api.read.mockClear(); vi.useFakeTimers(); await notify();
  expect(result.current.messages).toEqual([]); expect(result.current.blocked).toBe(true);
  expect(result.current.needsSignIn).toBe(false); expect(result.current.draft).toBe('Keep my draft');
  expect(api.read).not.toHaveBeenCalled();
});

it('does not select or fetch a conversation after an unmounted list request resolves', async () => {
  const list = deferred<{ items: GroupConversation[]; nextBeforeGroupId: number | null }>();
  api.groups.mockReturnValue(list.promise);
  const { unmount } = renderHook(() => useMessenger(42, 'Traveler'));
  unmount();
  await act(async () => list.resolve({ items: [group(1)], nextBeforeGroupId: null }));
  expect(api.history).not.toHaveBeenCalled(); expect(api.members).not.toHaveBeenCalled();
});

it('retains an uncertain operation nonce across retries and keeps a newer draft on success', async () => {
  api.post.mockRejectedValueOnce(new TravelGroupHttpError(503, 'Lost response'));
  const { result } = renderHook(() => useMessenger(42, 'Traveler'));
  await waitFor(() => { expect(result.current.selected?.id).toBe(1); expect(result.current.loadingMessages).toBe(false); });
  act(() => result.current.setDraft('Original'));
  await act(async () => { await result.current.send('text', 'Original'); });
  const retry = deferred<GroupMessageApiDto>(); api.post.mockReturnValueOnce(retry.promise);
  let sending!: Promise<boolean>;
  act(() => { sending = result.current.send('text', 'Original'); });
  act(() => result.current.setDraft('New draft'));
  await act(async () => { retry.resolve(message(101, { senderUserId: 42, content: 'Original' })); await sending; });
  expect(api.post.mock.calls[1][1].clientMessageId).toBe(api.post.mock.calls[0][1].clientMessageId);
  expect(result.current.draft).toBe('New draft');
});
