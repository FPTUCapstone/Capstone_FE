import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getWeatherForecast,
  getWeatherLocationPreviews,
  isLiveWeatherApiEnabled,
  parseWeatherForecastResponse,
  WeatherForecastApiError,
} from '../services/weatherForecastApi';
import {
  buildMockWeatherForecast,
  CENTRAL_VIETNAM_LOCATIONS,
} from '../data/mockWeatherFixtures';

describe('weatherForecastApi', () => {
  const originalEnv = process.env.NEXT_PUBLIC_WEATHER_API_ENABLED;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_WEATHER_API_ENABLED;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_WEATHER_API_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_WEATHER_API_ENABLED = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it('returns deterministic Tomorrow.io-shaped mock forecast by default when API is disabled', async () => {
    expect(isLiveWeatherApiEnabled()).toBe(false);
    const fixedNow = new Date('2026-11-25T04:30:00Z');
    const forecast = await getWeatherForecast('hue', { now: fixedNow });

    expect(forecast.source).toBe('mock');
    expect(forecast.provider).toBe('Tomorrow.io');
    expect(forecast.location.id).toBe('hue');
    expect(forecast.hourly).toHaveLength(48);
    expect(forecast.daily).toHaveLength(5);
    expect(forecast.current.rainMmPerHour).toBeGreaterThan(0);
  });

  it('returns previews for all 5 Central Vietnam destinations', async () => {
    const previews = await getWeatherLocationPreviews({
      now: new Date('2026-11-25T04:30:00Z'),
    });
    expect(previews).toHaveLength(CENTRAL_VIETNAM_LOCATIONS.length);
    expect(previews.map((p) => p.location.id)).toEqual([
      'danang',
      'hoian',
      'hue',
      'bana-hills',
      'son-tra',
    ]);
  });

  it('calls the live BE endpoint and parses Tomorrow.io payload when NEXT_PUBLIC_WEATHER_API_ENABLED=true', async () => {
    process.env.NEXT_PUBLIC_WEATHER_API_ENABLED = 'true';
    const sample = buildMockWeatherForecast('hoian', new Date('2026-11-25T04:30:00Z'));

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(sample), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const live = await getWeatherForecast('hoian');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchSpy.mock.calls[0]?.[0] ?? '');
    expect(requestedUrl).toContain('/weather/forecast?');
    expect(requestedUrl).toContain('locationId=hoian');
    expect(live.source).toBe('api');
    expect(live.location.id).toBe('hoian');
    expect(live.daily).toHaveLength(5);
  });

  it('throws WeatherForecastApiError when live API returns non-2xx', async () => {
    process.env.NEXT_PUBLIC_WEATHER_API_ENABLED = 'true';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Provider down' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(getWeatherForecast('danang')).rejects.toBeInstanceOf(
      WeatherForecastApiError,
    );
  });

  it('rejects malformed payloads during strict response parsing', () => {
    expect(() =>
      parseWeatherForecastResponse({ current: {} }, CENTRAL_VIETNAM_LOCATIONS[0]),
    ).toThrow(WeatherForecastApiError);
  });
});
