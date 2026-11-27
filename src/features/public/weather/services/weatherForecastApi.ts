import { getApiBase } from '@/lib/apiBase';
import { messageForStatus, requestJson } from '@/lib/jsonRequest';
import { isRecord } from '@/lib/typeGuards';
import { DEFAULT_TIME_ZONE_ID, SUGGESTED_LOCATIONS } from '../data/suggestedLocations';
import type {
  CurrentWeatherDto,
  DailyForecastPointDto,
  HourlyForecastPointDto,
  UpcomingTripPointDto,
  UpcomingTripWarningDto,
  UpcomingTripWeatherDto,
  WeatherApiLocationDto,
  WeatherCoordinates,
  WeatherForecastResponseDto,
  WeatherLocation,
  WeatherLocationPreview,
} from '../types/weatherForecast';
import { isWithinVietnamBounds, OUT_OF_VIETNAM_ERROR_MESSAGE } from '../utils/weatherLocation';

export class WeatherForecastApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 0, code = 'WEATHER_UNAVAILABLE') {
    super(message);
    this.name = 'WeatherForecastApiError';
    this.status = status;
    this.code = code;
  }
}

const HTTP_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: OUT_OF_VIETNAM_ERROR_MESSAGE,
  429: 'Bạn đang gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút.',
  503: 'Dịch vụ thời tiết đang bận, vui lòng thử lại sau ít phút.',
};

function asFiniteNumber(value: unknown, fallback?: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (fallback !== undefined) return fallback;
  throw new WeatherForecastApiError(
    'Dữ liệu thời tiết từ máy chủ không hợp lệ.',
    502,
    'WEATHER_INVALID_PAYLOAD',
  );
}

function asString(value: unknown, fallback?: string): string {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new WeatherForecastApiError(
    'Dữ liệu thời tiết từ máy chủ không hợp lệ.',
    502,
    'WEATHER_INVALID_PAYLOAD',
  );
}

function parseLocation(raw: unknown): WeatherApiLocationDto {
  if (!isRecord(raw)) {
    throw new WeatherForecastApiError(
      'Thiếu tọa độ trong phản hồi thời tiết.',
      502,
      'WEATHER_INVALID_PAYLOAD',
    );
  }
  return {
    latitude: asFiniteNumber(raw.latitude),
    longitude: asFiniteNumber(raw.longitude),
    timeZoneId: asString(raw.timeZoneId, DEFAULT_TIME_ZONE_ID),
  };
}

function parseCurrent(raw: unknown): CurrentWeatherDto {
  if (!isRecord(raw)) {
    throw new WeatherForecastApiError(
      'Thiếu dữ liệu thời tiết hiện tại.',
      502,
      'WEATHER_INVALID_PAYLOAD',
    );
  }
  const weatherCode = asFiniteNumber(raw.weatherCode, 1101);
  const temperatureC = asFiniteNumber(raw.temperatureC);
  return {
    observedAtUtc: asString(raw.observedAtUtc, new Date().toISOString()),
    temperatureC,
    apparentTemperatureC: asFiniteNumber(raw.apparentTemperatureC, temperatureC),
    rainProbabilityPercent: asFiniteNumber(raw.rainProbabilityPercent, 0),
    rainMmPerHour: asFiniteNumber(raw.rainMmPerHour, 0),
    uvIndex: asFiniteNumber(raw.uvIndex, 0),
    windSpeedMps: asFiniteNumber(raw.windSpeedMps, 0),
    thunderstorm: typeof raw.thunderstorm === 'boolean' ? raw.thunderstorm : weatherCode === 8000,
    weatherCode,
    humidityPercent: asFiniteNumber(raw.humidityPercent, 0),
    visibilityKm: asFiniteNumber(raw.visibilityKm, 0),
    cloudCoverPercent: asFiniteNumber(raw.cloudCoverPercent, 0),
  };
}

function parseHourly(raw: unknown): HourlyForecastPointDto[] {
  if (!Array.isArray(raw)) {
    throw new WeatherForecastApiError(
      'Thiếu dữ liệu dự báo theo giờ.',
      502,
      'WEATHER_INVALID_PAYLOAD',
    );
  }
  return raw.map((entry) => {
    if (!isRecord(entry)) {
      throw new WeatherForecastApiError(
        'Bản ghi dự báo theo giờ không hợp lệ.',
        502,
        'WEATHER_INVALID_PAYLOAD',
      );
    }
    const weatherCode = asFiniteNumber(entry.weatherCode, 1101);
    const temp = asFiniteNumber(entry.temperatureC);
    return {
      startUtc: asString(entry.startUtc),
      temperatureC: temp,
      apparentTemperatureC: asFiniteNumber(entry.apparentTemperatureC, temp),
      rainProbabilityPercent: asFiniteNumber(entry.rainProbabilityPercent, 0),
      rainMmPerHour: asFiniteNumber(entry.rainMmPerHour, 0),
      uvIndex: asFiniteNumber(entry.uvIndex, 0),
      windSpeedMps: asFiniteNumber(entry.windSpeedMps, 0),
      thunderstorm:
        typeof entry.thunderstorm === 'boolean' ? entry.thunderstorm : weatherCode === 8000,
      weatherCode,
      humidityPercent: asFiniteNumber(entry.humidityPercent, 0),
      cloudCoverPercent: asFiniteNumber(entry.cloudCoverPercent, 0),
      visibilityKm: asFiniteNumber(entry.visibilityKm, 0),
    };
  });
}

function parseDailyPoint(entry: unknown): DailyForecastPointDto {
  if (!isRecord(entry)) {
    throw new WeatherForecastApiError(
      'Bản ghi dự báo theo ngày không hợp lệ.',
      502,
      'WEATHER_INVALID_PAYLOAD',
    );
  }
  const weatherCode = asFiniteNumber(entry.weatherCode, 1101);
  const maxTempC = asFiniteNumber(entry.maxTempC);
  return {
    date: asString(entry.date),
    minTempC: asFiniteNumber(entry.minTempC),
    maxTempC,
    maxApparentTempC: asFiniteNumber(entry.maxApparentTempC, maxTempC),
    maxRainProbabilityPercent: asFiniteNumber(entry.maxRainProbabilityPercent, 0),
    maxRainMmPerHour: asFiniteNumber(entry.maxRainMmPerHour, 0),
    totalRainMm: asFiniteNumber(entry.totalRainMm, 0),
    maxUvIndex: asFiniteNumber(entry.maxUvIndex, 0),
    maxWindSpeedMps: asFiniteNumber(entry.maxWindSpeedMps, 0),
    thunderstorm:
      typeof entry.thunderstorm === 'boolean' ? entry.thunderstorm : weatherCode === 8000,
    weatherCode,
    humidityAvgPercent: asFiniteNumber(entry.humidityAvgPercent, 0),
    sunriseTime: asString(entry.sunriseTime, '05:56'),
    sunsetTime: asString(entry.sunsetTime, '17:18'),
  };
}

function parseDaily(raw: unknown): DailyForecastPointDto[] {
  if (!Array.isArray(raw)) {
    throw new WeatherForecastApiError(
      'Thiếu dữ liệu dự báo theo ngày.',
      502,
      'WEATHER_INVALID_PAYLOAD',
    );
  }
  return raw.map((entry) => parseDailyPoint(entry));
}

export function parseWeatherForecastResponse(body: unknown): WeatherForecastResponseDto {
  if (!isRecord(body)) {
    throw new WeatherForecastApiError(
      'Phản hồi dự báo thời tiết không đúng định dạng.',
      502,
      'WEATHER_INVALID_PAYLOAD',
    );
  }
  const location = parseLocation(body.location);
  return {
    source: 'api',
    provider: 'Tomorrow.io',
    location,
    timeZoneId: asString(body.timeZoneId, location.timeZoneId),
    fetchedAtUtc: asString(body.fetchedAtUtc, new Date().toISOString()),
    current: parseCurrent(body.current),
    hourly: parseHourly(body.hourly),
    daily: parseDaily(body.daily),
  };
}

export interface GetWeatherForecastOptions {
  signal?: AbortSignal;
}

export async function getWeatherForecast(
  coords: WeatherCoordinates,
  options: GetWeatherForecastOptions = {},
): Promise<WeatherForecastResponseDto> {
  if (!isWithinVietnamBounds(coords.latitude, coords.longitude)) {
    throw new WeatherForecastApiError(OUT_OF_VIETNAM_ERROR_MESSAGE, 400, 'WEATHER_OUT_OF_BOUNDS');
  }

  const params = new URLSearchParams({
    lat: String(coords.latitude),
    lon: String(coords.longitude),
  });
  const url = `${getApiBase()}/weather/forecast?${params.toString()}`;

  const { status, body } = await requestJson(url, {
    method: 'GET',
    signal: options.signal,
    cache: 'no-store',
    networkError: () =>
      new WeatherForecastApiError(
        'Không thể kết nối tới dịch vụ dự báo thời tiết. Vui lòng thử lại.',
        0,
        'WEATHER_NETWORK_ERROR',
      ),
  });

  if (status < 200 || status >= 300) {
    throw new WeatherForecastApiError(
      messageForStatus(
        status,
        HTTP_ERROR_MESSAGES,
        'Không thể tải dữ liệu dự báo thời tiết vào lúc này.',
      ),
      status,
      `WEATHER_HTTP_${status}`,
    );
  }

  return parseWeatherForecastResponse(body);
}

export interface GetWeatherLocationPreviewsOptions extends GetWeatherForecastOptions {
  locations?: readonly WeatherLocation[];
}

export async function getWeatherLocationPreviews(
  options: GetWeatherLocationPreviewsOptions = {},
): Promise<WeatherLocationPreview[]> {
  const locations = options.locations ?? SUGGESTED_LOCATIONS;
  const results = await Promise.allSettled(
    locations.map((loc) =>
      getWeatherForecast(
        { latitude: loc.latitude, longitude: loc.longitude },
        { signal: options.signal },
      ),
    ),
  );

  const previews: WeatherLocationPreview[] = [];
  locations.forEach((loc, idx) => {
    const settled = results[idx];
    if (settled?.status === 'fulfilled') {
      const current = settled.value.current;
      previews.push({
        location: loc,
        temperatureC: current.temperatureC,
        rainProbabilityPercent: current.rainProbabilityPercent,
        rainMmPerHour: current.rainMmPerHour,
        weatherCode: current.weatherCode,
        thunderstorm: current.thunderstorm,
      });
    }
  });
  return previews;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function parseUpcomingTripPoint(raw: unknown): UpcomingTripPointDto | null {
  if (!isRecord(raw)) return null;
  if (
    typeof raw.latitude !== 'number' ||
    !Number.isFinite(raw.latitude) ||
    typeof raw.longitude !== 'number' ||
    !Number.isFinite(raw.longitude)
  ) {
    return null;
  }
  return {
    name: asNullableString(raw.name),
    latitude: raw.latitude,
    longitude: raw.longitude,
  };
}

function parseUpcomingTripWarning(raw: unknown): UpcomingTripWarningDto | null {
  if (!isRecord(raw)) return null;
  const reviewStatus = asNullableString(raw.reviewStatus);
  if (!reviewStatus) return null;
  return {
    reviewStatus,
    eventType: asNullableString(raw.eventType),
    severity: asNullableString(raw.severity),
    description: asNullableString(raw.description),
    validFromUtc: asNullableString(raw.validFromUtc),
    validToUtc: asNullableString(raw.validToUtc),
    operatorInstructions: asNullableString(raw.operatorInstructions),
  };
}

function parseOptionalDailyPoint(raw: unknown): DailyForecastPointDto | null {
  if (raw == null) return null;
  try {
    return parseDailyPoint(raw);
  } catch {
    return null;
  }
}

/**
 * Parses `GET /api/v1/traveler/upcoming-trip-weather` without sorting or slicing.
 * Malformed payloads or entries are ignored so personal trips never disrupt the public page.
 */
export function parseUpcomingTripWeatherResponse(body: unknown): UpcomingTripWeatherDto[] {
  if (!isRecord(body) || !Array.isArray(body.trips)) {
    return [];
  }

  const trips: UpcomingTripWeatherDto[] = [];
  for (const entry of body.trips) {
    if (!isRecord(entry)) continue;
    const bookingId = entry.bookingId;
    const tourTitle = asNullableString(entry.tourTitle);
    const startAtUtc = asNullableString(entry.startAtUtc);
    const endAtUtc = asNullableString(entry.endAtUtc);
    if (
      typeof bookingId !== 'number' ||
      !Number.isFinite(bookingId) ||
      !tourTitle ||
      !startAtUtc ||
      !endAtUtc
    ) {
      continue;
    }

    trips.push({
      bookingId,
      bookingCode: typeof entry.bookingCode === 'string' ? entry.bookingCode : '',
      tourScheduleId:
        typeof entry.tourScheduleId === 'number' && Number.isFinite(entry.tourScheduleId)
          ? entry.tourScheduleId
          : 0,
      tourTitle,
      startAtUtc,
      endAtUtc,
      inProgress: entry.inProgress === true,
      point: parseUpcomingTripPoint(entry.point),
      forecastDate: typeof entry.forecastDate === 'string' ? entry.forecastDate : '',
      forecast: parseOptionalDailyPoint(entry.forecast),
      warning: parseUpcomingTripWarning(entry.warning),
    });
  }
  return trips;
}

/**
 * Fetches confirmed upcoming tour departures with meeting-point weather for a signed-in Traveler.
 * Any non-2xx status (401/403/429/5xx) or network error silently resolves to `[]` so the public
 * forecast remains unaffected.
 */
export async function getUpcomingTripWeather(
  accessToken: string,
  options: GetWeatherForecastOptions = {},
): Promise<UpcomingTripWeatherDto[]> {
  if (!accessToken.trim()) {
    return [];
  }

  const url = `${getApiBase()}/traveler/upcoming-trip-weather`;
  try {
    const { status, body } = await requestJson(url, {
      method: 'GET',
      accessToken,
      signal: options.signal,
      cache: 'no-store',
      networkError: () =>
        new WeatherForecastApiError(
          'Không thể tải danh sách chuyến đi sắp tới.',
          0,
          'UPCOMING_TRIPS_NETWORK_ERROR',
        ),
    });

    if (status < 200 || status >= 300) {
      return [];
    }

    return parseUpcomingTripWeatherResponse(body);
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return [];
  }
}
