import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import type { WeatherSafetyReviewChanged } from '../types';
import { AuthStorage } from '@/features/auth/session/authSession';

export interface UseWeatherSafetyRealtimeOptions {
  onReviewChanged?: (event: WeatherSafetyReviewChanged) => void;
  onRefreshHint?: () => void;
  enabled?: boolean;
}

export function useWeatherSafetyRealtime({
  onReviewChanged,
  onRefreshHint,
  enabled = true,
}: UseWeatherSafetyRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('Disconnected');

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRefreshHintRef = useRef(onRefreshHint);
  const onReviewChangedRef = useRef(onReviewChanged);

  useEffect(() => {
    onRefreshHintRef.current = onRefreshHint;
    onReviewChangedRef.current = onReviewChanged;
  });

  const triggerRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onRefreshHintRef.current?.();
    }, 250);
  }, []);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(() => {
      onRefreshHintRef.current?.();
    }, 30000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    let disposed = false;

    const hubUrl =
      process.env.NEXT_PUBLIC_SIGNALR_URL ||
      (process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')}/hubs/operator-weather-safety`
        : 'http://localhost:5021/hubs/operator-weather-safety');

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => AuthStorage.getAccessToken() || '',
      })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connection.on('WeatherSafetyReviewChanged', (event: WeatherSafetyReviewChanged) => {
      onReviewChangedRef.current?.(event);
      triggerRefresh();
    });

    connection.onreconnecting(() => {
      setIsConnected(false);
      setConnectionState('Reconnecting');
      startPolling();
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      setConnectionState('Connected');
      stopPolling();
      triggerRefresh();
    });

    connection.onclose(() => {
      if (disposed) return;
      setIsConnected(false);
      setConnectionState('Disconnected');
      startPolling();
    });

    connection
      .start()
      .then(() => {
        if (disposed) return;
        setIsConnected(true);
        setConnectionState('Connected');
        stopPolling();
      })
      .catch(() => {
        if (disposed) return;
        setIsConnected(false);
        setConnectionState('Disconnected');
        startPolling();
      });

    const handleOnline = () => {
      onRefreshHintRef.current?.();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onRefreshHintRef.current?.();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (connection && typeof connection.stop === 'function') {
        Promise.resolve(connection.stop()).catch(() => {});
      }
    };
  }, [enabled, startPolling, stopPolling, triggerRefresh]);

  return {
    isConnected,
    connectionState,
  };
}
