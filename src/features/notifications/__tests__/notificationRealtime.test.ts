import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as signalR from '@microsoft/signalr';
import { AuthStorage } from '@/features/auth/session/authSession';
import * as apiBase from '@/lib/apiBase';
import { getNotificationsHubUrl, subscribeToNotificationChanges } from '../notificationRealtime';

describe('notificationRealtime', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves hub url from direct API origin and same-origin proxy path', () => {
    vi.spyOn(apiBase, 'getApiBase').mockReturnValue('http://localhost:5000/api/v1');
    expect(getNotificationsHubUrl()).toBe('http://localhost:5000/hubs/notifications');

    vi.spyOn(apiBase, 'getApiBase').mockReturnValue('/api/v1');
    expect(getNotificationsHubUrl()).toBe('/hubs/notifications');
  });

  it('returns a no-op cleanup when no browser access token is stored', () => {
    vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue(null);
    const builderSpy = vi.spyOn(signalR, 'HubConnectionBuilder');

    const unsubscribe = subscribeToNotificationChanges(vi.fn());
    unsubscribe();

    expect(builderSpy).not.toHaveBeenCalled();
  });

  it('connects to /hubs/notifications, triggers on NotificationsChanged and reconnect, and stops on cleanup', () => {
    vi.spyOn(apiBase, 'getApiBase').mockReturnValue('/api/v1');
    vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue('jwt-token');
    vi.spyOn(AuthStorage, 'getContext').mockReturnValue({
      userId: 42,
      role: 'Traveler',
      fullName: 'Minh',
      email: 'minh@example.com',
      mustChangePassword: false,
      status: 'Active',
      applicationStatus: null,
      applicationUnresolved: false,
      accessToken: 'jwt-token',
      accessTokenExpiresAtUtc: '2027-01-01T00:00:00Z',
    });

    const handlers: Record<string, () => void> = {};
    let reconnectedHandler: (() => void) | undefined;
    let capturedUrl = '';
    let capturedOptions: signalR.IHttpConnectionOptions | undefined;

    const fakeConnection = {
      on: vi.fn((event: string, cb: () => void) => {
        handlers[event] = cb;
      }),
      onreconnected: vi.fn((cb: () => void) => {
        reconnectedHandler = cb;
      }),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(signalR, 'HubConnectionBuilder').mockImplementation(function () {
      return {
        withUrl(url: string, options?: signalR.IHttpConnectionOptions) {
          capturedUrl = url;
          capturedOptions = options;
          return this;
        },
        configureLogging() {
          return this;
        },
        withAutomaticReconnect() {
          return this;
        },
        build: () => fakeConnection,
      } as unknown as signalR.HubConnectionBuilder;
    });

    const onChange = vi.fn();
    const unsubscribe = subscribeToNotificationChanges(onChange);

    expect(capturedUrl).toBe('/hubs/notifications');
    expect(capturedOptions?.transport).toBe(signalR.HttpTransportType.LongPolling);
    expect(capturedOptions?.accessTokenFactory?.()).toBe('jwt-token');
    expect(fakeConnection.start).toHaveBeenCalledTimes(1);

    handlers.NotificationsChanged?.();
    reconnectedHandler?.();
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    expect(fakeConnection.stop).toHaveBeenCalledTimes(1);

    handlers.NotificationsChanged?.();
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
