import { afterEach, describe, expect, it, vi } from 'vitest';
import { SUGGESTED_LOCATIONS } from '../data/suggestedLocations';
import {
  getUpcomingTripWeather,
  getWeatherForecast,
  getWeatherLocationPreviews,
  parseUpcomingTripWeatherResponse,
  parseWeatherForecastResponse,
  WeatherForecastApiError,
} from '../services/weatherForecastApi';

function createBeForecastPayload(overrides: Record<string, unknown> = {}) {
  return {
    source: 'api',
    provider: 'Tomorrow.io',
    location: {
      latitude: 16.05,
      longitude: 108.2,
      timeZoneId: 'Asia/Ho_Chi_Minh',
    },
    timeZoneId: 'Asia/Ho_Chi_Minh',
    fetchedAtUtc: '2026-11-26T06:05:51.57Z',
    current: {
      observedAtUtc: '2026-11-26T06:00:00Z',
      temperatureC: 25.07,
      apparentTemperatureC: 25.1,
      rainProbabilityPercent: 35,
      rainMmPerHour: 0.07,
      uvIndex: 1,
      windSpeedMps: 2.9,
      thunderstorm: false,
      weatherCode: 1001,
      humidityPercent: 77,
      visibilityKm: 16,
      cloudCoverPercent: 100,
    },
    hourly: [
      {
        startUtc: '2026-11-26T06:00:00Z',
        temperatureC: 25.07,
        apparentTemperatureC: 25.1,
        rainProbabilityPercent: 35,
        rainMmPerHour: 0.07,
        uvIndex: 1,
        windSpeedMps: 2.9,
        thunderstorm: false,
        weatherCode: 1001,
        humidityPercent: 77,
        visibilityKm: 16,
        cloudCoverPercent: 100,
      },
      {
        startUtc: '2026-11-26T07:00:00Z',
        temperatureC: 24.8,
        apparentTemperatureC: 24.9,
        rainProbabilityPercent: 40,
        rainMmPerHour: 0.2,
        uvIndex: 1,
        windSpeedMps: 3.1,
        thunderstorm: false,
        weatherCode: 4000,
        humidityPercent: 79,
        visibilityKm: 14,
        cloudCoverPercent: 95,
      },
    ],
    daily: [
      {
        date: '2026-11-26',
        minTempC: 22.79,
        maxTempC: 25.07,
        maxApparentTempC: 26,
        maxRainProbabilityPercent: 84,
        maxRainMmPerHour: 3.1,
        totalRainMm: 13.66,
        maxUvIndex: 1,
        maxWindSpeedMps: 6,
        thunderstorm: false,
        weatherCode: 4001,
        humidityAvgPercent: 85,
        sunriseTime: '05:56',
        sunsetTime: '17:13',
      },
    ],
    ...overrides,
  };
}

describe('weatherForecastApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls GET /weather/forecast with lat and lon only (no locationId) and parses BE response', async () => {
    const payload = createBeForecastPayload({
      location: { latitude: 15.88, longitude: 108.34, timeZoneId: 'Asia/Ho_Chi_Minh' },
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const forecast = await getWeatherForecast({ latitude: 15.8801, longitude: 108.338 });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchSpy.mock.calls[0]?.[0] ?? '');
    expect(requestedUrl).toContain('/weather/forecast?');
    expect(requestedUrl).toContain('lat=15.8801');
    expect(requestedUrl).toContain('lon=108.338');
    expect(requestedUrl).not.toContain('locationId');
    expect(forecast.source).toBe('api');
    expect(forecast.provider).toBe('Tomorrow.io');
    expect(forecast.location).toEqual({
      latitude: 15.88,
      longitude: 108.34,
      timeZoneId: 'Asia/Ho_Chi_Minh',
    });
    expect(forecast.current.temperatureC).toBe(25.07);
    expect(forecast.hourly).toHaveLength(2);
    expect(forecast.daily).toHaveLength(1);
  });

  it('blocks coordinates outside Vietnam bounding box without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      getWeatherForecast({ latitude: 35.6762, longitude: 139.6503 }),
    ).rejects.toMatchObject({
      name: 'WeatherForecastApiError',
      status: 400,
      message: 'Chỉ hỗ trợ địa điểm trong Việt Nam.',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('maps 503 and 429 HTTP responses to friendly Vietnamese retry messages', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ title: 'Service Unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      getWeatherForecast({ latitude: 16.05, longitude: 108.2 }),
    ).rejects.toMatchObject({
      name: 'WeatherForecastApiError',
      status: 503,
      message: 'Dịch vụ thời tiết đang bận, vui lòng thử lại sau ít phút.',
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ title: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      getWeatherForecast({ latitude: 16.05, longitude: 108.2 }),
    ).rejects.toMatchObject({
      name: 'WeatherForecastApiError',
      status: 429,
      message: expect.stringMatching(/thử lại sau ít phút/i),
    });
  });

  it('parses sparse responses with fewer than 24 hourly points or fewer than 5 daily points (including empty)', () => {
    const sparse = parseWeatherForecastResponse(
      createBeForecastPayload({ hourly: [], daily: [] }),
    );
    expect(sparse.hourly).toEqual([]);
    expect(sparse.daily).toEqual([]);
    expect(sparse.current.temperatureC).toBe(25.07);
  });

  it('rejects malformed payloads during strict response parsing', () => {
    expect(() => parseWeatherForecastResponse({ current: {} })).toThrow(WeatherForecastApiError);
    expect(() => parseWeatherForecastResponse(null)).toThrow(WeatherForecastApiError);
  });

  it('fetches previews for suggested locations and omits failed ones without falling back to mock data', async () => {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount += 1;
      if (callCount === 2) {
        return new Response(JSON.stringify({ detail: 'Busy' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify(
          createBeForecastPayload({
            current: {
              ...createBeForecastPayload().current,
              temperatureC: 20 + callCount,
            },
          }),
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    const previews = await getWeatherLocationPreviews({
      locations: SUGGESTED_LOCATIONS.slice(0, 3),
    });

    expect(previews).toHaveLength(2);
    expect(previews.map((p) => p.location.id)).toEqual(['danang', 'hue']);
    expect(previews[0]?.temperatureC).toBe(21);
    expect(previews[1]?.temperatureC).toBe(23);
  });

  describe('getUpcomingTripWeather', () => {
    it('calls GET /traveler/upcoming-trip-weather with Bearer token and parses trips including nullable fields', async () => {
      const payload = {
        trips: [
          {
            bookingId: 101,
            bookingCode: 'BK-0001',
            tourScheduleId: 1101,
            tourTitle: 'Tour Bà Nà',
            startAtUtc: '2026-11-27T23:30:00+00:00',
            endAtUtc: '2026-11-28T09:30:00+00:00',
            inProgress: false,
            point: { name: 'Khách sạn Đà Nẵng', latitude: 16.0544, longitude: 108.2022 },
            forecastDate: '2026-11-28',
            forecast: createBeForecastPayload().daily[0],
            warning: {
              reviewStatus: 'PendingAcknowledgement',
              eventType: 'Thunderstorm',
              severity: 'Severe',
              description: 'Dông lớn',
              validFromUtc: '2026-11-27T23:30:00+00:00',
              validToUtc: '2026-11-28T03:30:00+00:00',
              operatorInstructions: null,
            },
          },
          {
            bookingId: 102,
            bookingCode: 'BK-0002',
            tourScheduleId: 1102,
            tourTitle: 'Tour chưa có tọa độ',
            startAtUtc: '2026-11-29T01:00:00+00:00',
            endAtUtc: '2026-11-29T09:00:00+00:00',
            inProgress: true,
            point: null,
            forecastDate: '2026-11-29',
            forecast: null,
            warning: null,
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const trips = await getUpcomingTripWeather('traveler-jwt');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [requestedUrl, init] = fetchSpy.mock.calls[0] ?? [];
      expect(String(requestedUrl)).toContain('/traveler/upcoming-trip-weather');
      expect((init?.headers as Record<string, string>)?.Authorization).toBe('Bearer traveler-jwt');
      expect(trips).toHaveLength(2);
      expect(trips[0]?.bookingId).toBe(101);
      expect(trips[0]?.point?.name).toBe('Khách sạn Đà Nẵng');
      expect(trips[0]?.warning?.reviewStatus).toBe('PendingAcknowledgement');
      expect(trips[1]?.point).toBeNull();
      expect(trips[1]?.forecast).toBeNull();
      expect(trips[1]?.warning).toBeNull();
      expect(trips[1]?.inProgress).toBe(true);
    });

    it('silently returns empty array on 401, 403, 429, 503, and network errors', async () => {
      for (const status of [401, 403, 429, 503]) {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
          new Response(JSON.stringify({ title: 'Error' }), {
            status,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
        await expect(getUpcomingTripWeather('traveler-jwt')).resolves.toEqual([]);
      }

      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(getUpcomingTripWeather('traveler-jwt')).resolves.toEqual([]);
    });

    it('returns empty array for malformed upcoming-trip-weather payloads without crashing', () => {
      expect(parseUpcomingTripWeatherResponse(null)).toEqual([]);
      expect(parseUpcomingTripWeatherResponse({})).toEqual([]);
      expect(parseUpcomingTripWeatherResponse({ trips: ['bad'] })).toEqual([]);
    });
  });
});
