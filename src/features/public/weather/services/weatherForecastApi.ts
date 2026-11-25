import { getApiBase } from '@/lib/apiBase';
import { requestJson } from '@/lib/jsonRequest';
import { isRecord } from '@/lib/typeGuards';
import {
  buildMockWeatherForecast,
  CENTRAL_VIETNAM_LOCATIONS,
  getMockLocationPreviews,
  resolveWeatherLocation,
} from '../data/mockWeatherFixtures';
import type {
  CurrentWeatherDto,
  DailyForecastPointDto,
  HourlyForecastPointDto,
  WeatherForecastResponseDto,
  WeatherLocationDto,
  WeatherLocationPreview,
} from '../types/weatherForecast';

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

/**
 * Toggle for connecting the live Capstone_BE public weather endpoint once implemented.
 *
 * Expected BE endpoint contract (Tomorrow.io proxy):
 * `GET {API_BASE}/weather/forecast?locationId={id}&lat={latitude}&lon={longitude}`
 *
 * Response `200 OK` JSON shape: `WeatherForecastResponseDto`
 * (`location`, `timeZoneId`, `fetchedAtUtc`, `current`, `hourly[]`, `daily[]`).
 */
export function isLiveWeatherApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WEATHER_API_ENABLED === 'true';
}

function asFiniteNumber(value: unknown, fallback?: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (fallback !== undefined) return fallback;
  throw new WeatherForecastApiError('Dữ liệu thời tiết từ máy chủ không hợp lệ.', 502, 'WEATHER_INVALID_PAYLOAD');
}

function asString(value: unknown, fallback?: string): string {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new WeatherForecastApiError('Dữ liệu thời tiết từ máy chủ không hợp lệ.', 502, 'WEATHER_INVALID_PAYLOAD');
}

function parseLocation(raw: unknown, fallback: WeatherLocationDto): WeatherLocationDto {
  if (!isRecord(raw)) return fallback;
  return {
    id: asString(raw.id, fallback.id),
    name: asString(raw.name, fallback.name),
    region: asString(raw.region, fallback.region),
    subtitle: asString(raw.subtitle, fallback.subtitle),
    latitude: asFiniteNumber(raw.latitude, fallback.latitude),
    longitude: asFiniteNumber(raw.longitude, fallback.longitude),
    elevationM: asFiniteNumber(raw.elevationM, fallback.elevationM),
    timeZoneId: asString(raw.timeZoneId, fallback.timeZoneId),
  };
}

function parseCurrent(raw: unknown): CurrentWeatherDto {
  if (!isRecord(raw)) {
    throw new WeatherForecastApiError('Thiếu dữ liệu thời tiết hiện tại.', 502, 'WEATHER_INVALID_PAYLOAD');
  }
  const weatherCode = asFiniteNumber(raw.weatherCode, 1101);
  return {
    observedAtUtc: asString(raw.observedAtUtc, new Date().toISOString()),
    temperatureC: asFiniteNumber(raw.temperatureC),
    apparentTemperatureC: asFiniteNumber(raw.apparentTemperatureC, asFiniteNumber(raw.temperatureC)),
    rainProbabilityPercent: asFiniteNumber(raw.rainProbabilityPercent, 0),
    rainMmPerHour: asFiniteNumber(raw.rainMmPerHour, 0),
    uvIndex: asFiniteNumber(raw.uvIndex, 0),
    windSpeedMps: asFiniteNumber(raw.windSpeedMps, 0),
    thunderstorm: typeof raw.thunderstorm === 'boolean' ? raw.thunderstorm : weatherCode === 8000,
    weatherCode,
    humidityPercent: asFiniteNumber(raw.humidityPercent, 75),
    visibilityKm: asFiniteNumber(raw.visibilityKm, 10),
    cloudCoverPercent: asFiniteNumber(raw.cloudCoverPercent, 40),
  };
}

function parseHourly(raw: unknown): HourlyForecastPointDto[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new WeatherForecastApiError('Thiếu dữ liệu dự báo theo giờ.', 502, 'WEATHER_INVALID_PAYLOAD');
  }
  return raw.map((entry) => {
    if (!isRecord(entry)) {
      throw new WeatherForecastApiError('Bản ghi dự báo theo giờ không hợp lệ.', 502, 'WEATHER_INVALID_PAYLOAD');
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
      thunderstorm: typeof entry.thunderstorm === 'boolean' ? entry.thunderstorm : weatherCode === 8000,
      weatherCode,
      humidityPercent: asFiniteNumber(entry.humidityPercent, 75),
      cloudCoverPercent: asFiniteNumber(entry.cloudCoverPercent, 40),
      visibilityKm: asFiniteNumber(entry.visibilityKm, 10),
    };
  });
}

function parseDaily(raw: unknown): DailyForecastPointDto[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new WeatherForecastApiError('Thiếu dữ liệu dự báo theo ngày.', 502, 'WEATHER_INVALID_PAYLOAD');
  }
  return raw.map((entry) => {
    if (!isRecord(entry)) {
      throw new WeatherForecastApiError('Bản ghi dự báo theo ngày không hợp lệ.', 502, 'WEATHER_INVALID_PAYLOAD');
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
      thunderstorm: typeof entry.thunderstorm === 'boolean' ? entry.thunderstorm : weatherCode === 8000,
      weatherCode,
      humidityAvgPercent: asFiniteNumber(entry.humidityAvgPercent, 75),
      sunriseTime: asString(entry.sunriseTime, '05:56'),
      sunsetTime: asString(entry.sunsetTime, '17:18'),
    };
  });
}

export function parseWeatherForecastResponse(
  body: unknown,
  fallbackLocation: WeatherLocationDto,
): WeatherForecastResponseDto {
  if (!isRecord(body)) {
    throw new WeatherForecastApiError('Phản hồi dự báo thời tiết không đúng định dạng.', 502, 'WEATHER_INVALID_PAYLOAD');
  }
  const location = parseLocation(body.location, fallbackLocation);
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
  now?: Date;
}

export async function getWeatherForecast(
  locationId: string,
  options: GetWeatherForecastOptions = {},
): Promise<WeatherForecastResponseDto> {
  const location = resolveWeatherLocation(locationId);

  if (!isLiveWeatherApiEnabled()) {
    return buildMockWeatherForecast(location.id, options.now);
  }

  const params = new URLSearchParams({
    locationId: location.id,
    lat: String(location.latitude),
    lon: String(location.longitude),
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
      status === 503
        ? 'Dịch vụ dữ liệu khí tượng Tomorrow.io tạm thời gián đoạn.'
        : 'Không thể tải dữ liệu dự báo thời tiết vào lúc này.',
      status,
      `WEATHER_HTTP_${status}`,
    );
  }

  return parseWeatherForecastResponse(body, location);
}

export async function getWeatherLocationPreviews(
  options: GetWeatherForecastOptions = {},
): Promise<WeatherLocationPreview[]> {
  if (!isLiveWeatherApiEnabled()) {
    return getMockLocationPreviews(options.now);
  }

  const results = await Promise.allSettled(
    CENTRAL_VIETNAM_LOCATIONS.map((loc) => getWeatherForecast(loc.id, options)),
  );

  return CENTRAL_VIETNAM_LOCATIONS.map((loc, idx) => {
    const settled = results[idx];
    if (settled?.status === 'fulfilled') {
      const current = settled.value.current;
      return {
        location: settled.value.location,
        temperatureC: current.temperatureC,
        rainProbabilityPercent: current.rainProbabilityPercent,
        rainMmPerHour: current.rainMmPerHour,
        weatherCode: current.weatherCode,
        thunderstorm: current.thunderstorm,
      };
    }
    const fallback = buildMockWeatherForecast(loc.id, options.now);
    return {
      location: loc,
      temperatureC: fallback.current.temperatureC,
      rainProbabilityPercent: fallback.current.rainProbabilityPercent,
      rainMmPerHour: fallback.current.rainMmPerHour,
      weatherCode: fallback.current.weatherCode,
      thunderstorm: fallback.current.thunderstorm,
    };
  });
}
