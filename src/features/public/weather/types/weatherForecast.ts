/**
 * Public Weather Forecast DTO contract aligned with Capstone_BE `GET /api/v1/weather/forecast`.
 *
 * Field names and units mirror:
 * - `TripMate.Application.Features.Itineraries.WeatherTips.HourlyForecast`
 * - `TripMate.Application.Features.Itineraries.WeatherTips.WeatherTipsSummaryDto`
 * - `TripMate.Infrastructure.Weather.TomorrowDayForecastProvider` (Tomorrow.io v4 metric units)
 */

export type WeatherDataSource = 'api';

export type WeatherConditionGroup = 'clear' | 'cloudy' | 'fog' | 'rain' | 'storm';

export type WeatherMetricTab = 'temperature' | 'rain' | 'uv' | 'wind';

export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
}

/** Coordinates and time zone returned by Capstone_BE (display names live on FE). */
export interface WeatherApiLocationDto extends WeatherCoordinates {
  timeZoneId: string;
}

/** FE display location built from suggested destinations, Mapbox search, URL params, or geolocation. */
export interface WeatherLocation extends WeatherCoordinates {
  /** Optional slug for matching one of the quick-suggestion chips (FE-only, never sent to BE). */
  id?: string;
  name: string;
  region?: string;
  subtitle?: string;
  elevationM?: number;
  timeZoneId: string;
}

/**
 * Mirrors Capstone_BE `HourlyForecast` (Tomorrow.io `timesteps=1h&units=metric`)
 * with atmospheric fields that Tomorrow.io exposes in `values`.
 */
export interface HourlyForecastPointDto {
  /** ISO-8601 UTC start of the whole hour (matches `HourlyForecast.StartUtc`). */
  startUtc: string;
  temperatureC: number;
  apparentTemperatureC: number;
  rainProbabilityPercent: number;
  rainMmPerHour: number;
  uvIndex: number;
  /** Wind speed in meters per second (matches `HourlyForecast.WindSpeedMps`). */
  windSpeedMps: number;
  /** True when Tomorrow.io weatherCode === 8000 (matches `HourlyForecast.Thunderstorm`). */
  thunderstorm: boolean;
  /** Tomorrow.io weatherCode (e.g. 1000, 1100, 1101, 1001, 4000, 4001, 4200, 4201, 8000). */
  weatherCode: number;
  humidityPercent: number;
  cloudCoverPercent: number;
  visibilityKm: number;
}

/**
 * Daily aggregation compatible with Tomorrow.io `timesteps=1d` (up to 5-day window on Free tier)
 * and Capstone_BE `WeatherTipsSummaryDto`.
 */
export interface DailyForecastPointDto {
  /** Local calendar date `YYYY-MM-DD` in `timeZoneId`. */
  date: string;
  minTempC: number;
  maxTempC: number;
  maxApparentTempC: number;
  maxRainProbabilityPercent: number;
  maxRainMmPerHour: number;
  totalRainMm: number;
  maxUvIndex: number;
  maxWindSpeedMps: number;
  thunderstorm: boolean;
  weatherCode: number;
  humidityAvgPercent: number;
  sunriseTime: string;
  sunsetTime: string;
}

export interface CurrentWeatherDto {
  observedAtUtc: string;
  temperatureC: number;
  apparentTemperatureC: number;
  rainProbabilityPercent: number;
  rainMmPerHour: number;
  uvIndex: number;
  windSpeedMps: number;
  thunderstorm: boolean;
  weatherCode: number;
  humidityPercent: number;
  visibilityKm: number;
  cloudCoverPercent: number;
}

export interface WeatherForecastResponseDto {
  source: WeatherDataSource;
  provider: 'Tomorrow.io';
  location: WeatherApiLocationDto;
  timeZoneId: string;
  fetchedAtUtc: string;
  current: CurrentWeatherDto;
  /** Up to 24 hourly entries in ascending `startUtc` order (sparse points are dropped by BE). */
  hourly: HourlyForecastPointDto[];
  /** Up to 5 daily entries matching Tomorrow.io Free plan forecast window. */
  daily: DailyForecastPointDto[];
}

export interface WeatherLocationPreview {
  location: WeatherLocation;
  temperatureC: number;
  rainProbabilityPercent: number;
  rainMmPerHour: number;
  weatherCode: number;
  thunderstorm: boolean;
}

/** Coordinates where an upcoming tour departure's daily forecast is sampled. */
export interface UpcomingTripPointDto extends WeatherCoordinates {
  name: string | null;
}

/** Open UC-66 Weather Safety Review attached to an upcoming tour departure (read-only for Traveler). */
export interface UpcomingTripWarningDto {
  reviewStatus: string;
  eventType: string | null;
  severity: string | null;
  description: string | null;
  validFromUtc: string | null;
  validToUtc: string | null;
  operatorInstructions: string | null;
}

/** Confirmed Traveler tour departure returned by `GET /api/v1/traveler/upcoming-trip-weather`. */
export interface UpcomingTripWeatherDto {
  bookingId: number;
  bookingCode: string;
  tourScheduleId: number;
  tourTitle: string;
  startAtUtc: string;
  endAtUtc: string;
  inProgress: boolean;
  point: UpcomingTripPointDto | null;
  forecastDate: string;
  forecast: DailyForecastPointDto | null;
  warning: UpcomingTripWarningDto | null;
}
