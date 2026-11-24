import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useItineraryWeatherTips } from '../components/useItineraryWeatherTips';
import * as schedulingApi from '../services/schedulingApi';
import type { WeatherTipsDto } from '../types/schedulingTypes';

const TIPS: WeatherTipsDto = {
  date: '2026-11-25',
  timeZoneId: 'Asia/Ho_Chi_Minh',
  forecastAtUtc: '2026-11-24T03:00:00Z',
  summary: { minTempC: 22, maxTempC: 31, maxRainProbabilityPercent: 60, maxUvIndex: 8 },
  tips: [{ code: 'weather_tip.rain', severity: 'Info', text: 'Mang ô hoặc áo mưa' }],
};

interface Props {
  itineraryId: number;
  itinerary: { itineraryId: number } | null;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useItineraryWeatherTips', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => cleanup());

  it('does not request while the itinerary is null', () => {
    const spy = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(TIPS);

    const { result } = renderHook((props: Props) => useItineraryWeatherTips(props), {
      initialProps: { itineraryId: 7, itinerary: null },
    });

    expect(spy).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('does not request for an itinerary that is not the one in the address', () => {
    const spy = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(TIPS);

    renderHook((props: Props) => useItineraryWeatherTips(props), {
      initialProps: { itineraryId: 7, itinerary: { itineraryId: 6 } },
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('requests once after the itinerary has loaded and returns the tips', async () => {
    const spy = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(TIPS);

    const { result, rerender } = renderHook((props: Props) => useItineraryWeatherTips(props), {
      initialProps: { itineraryId: 7, itinerary: null } as Props,
    });
    rerender({ itineraryId: 7, itinerary: { itineraryId: 7 } });

    await waitFor(() => expect(result.current).toEqual(TIPS));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(7, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('does not request again when the itinerary object changes but keeps the same id', async () => {
    const spy = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(TIPS);

    const { result, rerender } = renderHook((props: Props) => useItineraryWeatherTips(props), {
      initialProps: { itineraryId: 7, itinerary: { itineraryId: 7 } } as Props,
    });
    await waitFor(() => expect(result.current).toEqual(TIPS));

    rerender({ itineraryId: 7, itinerary: { itineraryId: 7 } });
    rerender({ itineraryId: 7, itinerary: { itineraryId: 7 } });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual(TIPS);
  });

  it('aborts the request on unmount and ignores its late answer', async () => {
    const pending = deferred<WeatherTipsDto | null>();
    let signal: AbortSignal | undefined;
    vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockImplementation((_id, options) => {
      signal = options?.signal;
      return pending.promise;
    });

    const { result, unmount } = renderHook((props: Props) => useItineraryWeatherTips(props), {
      initialProps: { itineraryId: 7, itinerary: { itineraryId: 7 } } as Props,
    });
    await waitFor(() => expect(signal).toBeDefined());

    unmount();
    pending.resolve(TIPS);
    await Promise.resolve();

    expect(signal?.aborted).toBe(true);
    expect(result.current).toBeNull();
  });

  it('does not return a late answer for the previous id after the id changes', async () => {
    const first = deferred<WeatherTipsDto | null>();
    const second = deferred<WeatherTipsDto | null>();
    vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockImplementation((id) =>
      id === 1 ? first.promise : second.promise,
    );

    const { result, rerender } = renderHook((props: Props) => useItineraryWeatherTips(props), {
      initialProps: { itineraryId: 1, itinerary: { itineraryId: 1 } } as Props,
    });
    rerender({ itineraryId: 2, itinerary: { itineraryId: 2 } });

    first.resolve({ ...TIPS, date: '2026-11-01' });
    await Promise.resolve();
    expect(result.current).toBeNull();

    second.resolve(TIPS);
    await waitFor(() => expect(result.current).toEqual(TIPS));
  });

  it('returns null when the request rejects', async () => {
    const spy = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockRejectedValue(new Error('boom'));

    const { result } = renderHook((props: Props) => useItineraryWeatherTips(props), {
      initialProps: { itineraryId: 7, itinerary: { itineraryId: 7 } } as Props,
    });

    await waitFor(() => expect(spy).toHaveBeenCalled());
    await Promise.resolve();
    expect(result.current).toBeNull();
  });

  it('returns null when the API answers null', async () => {
    const spy = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(null);

    const { result } = renderHook((props: Props) => useItineraryWeatherTips(props), {
      initialProps: { itineraryId: 7, itinerary: { itineraryId: 7 } } as Props,
    });

    await waitFor(() => expect(spy).toHaveBeenCalled());
    await Promise.resolve();
    expect(result.current).toBeNull();
  });
});