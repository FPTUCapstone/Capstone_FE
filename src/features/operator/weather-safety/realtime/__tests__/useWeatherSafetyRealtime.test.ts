import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeatherSafetyRealtime } from '../useWeatherSafetyRealtime';
import * as signalR from '@microsoft/signalr';

describe('useWeatherSafetyRealtime', () => {
  let mockConnection: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    onclose: ReturnType<typeof vi.fn>;
    onreconnecting: ReturnType<typeof vi.fn>;
    onreconnected: ReturnType<typeof vi.fn>;
    state: signalR.HubConnectionState;
  };
  let eventHandlers: Record<string, (event: unknown) => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    eventHandlers = {};

    mockConnection = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      on: vi.fn((eventName: string, handler: (event: unknown) => void) => {
        eventHandlers[eventName] = handler;
      }),
      off: vi.fn(),
      onclose: vi.fn(),
      onreconnecting: vi.fn(),
      onreconnected: vi.fn(),
      state: signalR.HubConnectionState.Connected,
    };

    vi.spyOn(signalR, 'HubConnectionBuilder').mockImplementation(
      () =>
        ({
          withUrl: vi.fn().mockReturnThis(),
          configureLogging: vi.fn().mockReturnThis(),
          withAutomaticReconnect: vi.fn().mockReturnThis(),
          build: vi.fn().mockReturnValue(mockConnection),
        }) as unknown as signalR.HubConnectionBuilder
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not start polling when the connection closes after unmount', async () => {
    const onRefreshHint = vi.fn();
    const { unmount } = renderHook(() => useWeatherSafetyRealtime({ onRefreshHint }));
    await act(async () => {
      await Promise.resolve();
    });
    const onClose = mockConnection.onclose.mock.calls[0][0] as () => void;

    unmount();
    act(() => onClose());
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(onRefreshHint).not.toHaveBeenCalled();
  });

  it('connects to hub and registers WeatherSafetyReviewChanged event', async () => {
    const onRefreshHint = vi.fn();
    const { result } = renderHook(() =>
      useWeatherSafetyRealtime({ onRefreshHint, enabled: true })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockConnection.start).toHaveBeenCalled();
    expect(mockConnection.on).toHaveBeenCalledWith('WeatherSafetyReviewChanged', expect.any(Function));
    expect(result.current.isConnected).toBe(true);
  });

  it('coalesces rapid burst events into a single refresh call', async () => {
    const onRefreshHint = vi.fn();
    renderHook(() => useWeatherSafetyRealtime({ onRefreshHint, enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    const handler = eventHandlers['WeatherSafetyReviewChanged'];
    expect(handler).toBeDefined();

    // Fire 3 events within 50ms
    act(() => {
      handler({ reviewId: 1, tourScheduleId: 10, changeType: 'StatusChanged', occurredAtUtc: '2026-11-03T00:00:00Z' });
      handler({ reviewId: 2, tourScheduleId: 20, changeType: 'StatusChanged', occurredAtUtc: '2026-11-03T00:00:01Z' });
      handler({ reviewId: 3, tourScheduleId: 30, changeType: 'StatusChanged', occurredAtUtc: '2026-11-03T00:00:02Z' });
    });

    // Advance debounce timer (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onRefreshHint).toHaveBeenCalledTimes(1);
  });

  it('falls back to 30-second polling when disconnected', async () => {
    const onRefreshHint = vi.fn();
    mockConnection.start.mockRejectedValueOnce(new Error('Connection failed'));

    const { result } = renderHook(() =>
      useWeatherSafetyRealtime({ onRefreshHint, enabled: true })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isConnected).toBe(false);

    // Initial failure triggers polling interval of 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(onRefreshHint).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(onRefreshHint).toHaveBeenCalledTimes(2);
  });

  it('refreshes immediately when tab becomes visible or online event fires', async () => {
    const onRefreshHint = vi.fn();
    renderHook(() => useWeatherSafetyRealtime({ onRefreshHint, enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    // Trigger online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(onRefreshHint).toHaveBeenCalledTimes(1);
  });
});
