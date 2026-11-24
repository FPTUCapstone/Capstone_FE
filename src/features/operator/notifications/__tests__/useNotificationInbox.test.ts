import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationInbox } from '../useNotificationInbox';
import * as notificationsApi from '../notificationsApi';

const mockItem = {
  id: 1,
  type: 'TourApproved',
  title: 'Tour approved',
  body: 'Your tour package "Ba Na Hills" was approved.',
  relatedEntityType: 'Tour',
  relatedEntityId: 196,
  createdAtUtc: '2026-11-24T03:55:57.729Z',
  isRead: false,
};

describe('useNotificationInbox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches the inbox on mount and exposes unreadCount/items', async () => {
    vi.spyOn(notificationsApi, 'getNotificationInbox').mockResolvedValue({
      items: [mockItem],
      nextBeforeId: null,
    });

    const { result } = renderHook(() => useNotificationInbox());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.items[0].id).toBe(1);
  });

  it('polls every 30 seconds while enabled', async () => {
    const fetchSpy = vi.spyOn(notificationsApi, 'getNotificationInbox').mockResolvedValue({
      items: [],
      nextBeforeId: null,
    });

    renderHook(() => useNotificationInbox());

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(30000);
      await Promise.resolve();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('stops polling after unmount', async () => {
    const fetchSpy = vi.spyOn(notificationsApi, 'getNotificationInbox').mockResolvedValue({
      items: [],
      nextBeforeId: null,
    });

    const { unmount } = renderHook(() => useNotificationInbox());
    await act(async () => {
      await Promise.resolve();
    });
    const callsBeforeUnmount = fetchSpy.mock.calls.length;

    unmount();
    await act(async () => {
      vi.advanceTimersByTime(60000);
      await Promise.resolve();
    });

    expect(fetchSpy.mock.calls.length).toBe(callsBeforeUnmount);
  });

  it('does not poll when disabled', async () => {
    const fetchSpy = vi.spyOn(notificationsApi, 'getNotificationInbox').mockResolvedValue({
      items: [],
      nextBeforeId: null,
    });

    renderHook(() => useNotificationInbox({ enabled: false }));
    await act(async () => {
      vi.advanceTimersByTime(60000);
      await Promise.resolve();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('swallows fetch errors without throwing and keeps previous state', async () => {
    vi.spyOn(notificationsApi, 'getNotificationInbox').mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useNotificationInbox());
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('markRead calls the API and removes the item from unread count optimistically', async () => {
    vi.spyOn(notificationsApi, 'getNotificationInbox').mockResolvedValue({
      items: [mockItem],
      nextBeforeId: null,
    });
    const markReadSpy = vi.spyOn(notificationsApi, 'markNotificationRead').mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotificationInbox());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(markReadSpy).toHaveBeenCalledWith(1);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.items[0].isRead).toBe(true);
  });

  it('markRead swallows API errors and leaves the item unread instead of throwing', async () => {
    vi.spyOn(notificationsApi, 'getNotificationInbox').mockResolvedValue({
      items: [mockItem],
      nextBeforeId: null,
    });
    vi.spyOn(notificationsApi, 'markNotificationRead').mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useNotificationInbox());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.items).toHaveLength(1);

    await expect(
      act(async () => {
        await result.current.markRead(1);
      })
    ).resolves.toBeUndefined();

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.items[0].isRead).toBe(false);
  });
});
