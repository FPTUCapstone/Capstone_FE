/**
 * Public Weather Forecast DTO contract aligned with Capstone_BE Tomorrow.io integration.
 *
 * Field names and units mirror:
 * - `TripMate.Application.Features.Itineraries.WeatherTips.HourlyForecast`
 * - `TripMate.Application.Features.Itineraries.WeatherTips.WeatherTipsSummaryDto`
 * - `TripMate.Infrastructure.Weather.TomorrowDayForecastProvider` (Tomorrow.io v4 metric units)
 */

export type WeatherDataSource = 'mock' | 'api';

export type WeatherConditionGroup = 'clear' | 'cloudy' | 'fog' | 'rain' | 'storm';

export type WeatherMetricTab = 'temperature' | 'rain' | 'uv' | 'wind';

export interface WeatherLocationDto {
  /** Stable slug used in URL `?location=<id>` and API query parameters. */
  id: string;
  name: string;
  region: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  timeZoneId: string;
}

/**
 * Mirrors Capstone_BE `HourlyForecast` (Tomorrow.io `timesteps=1h&units=metric`)
 * with optional atmospheric fields that Tomorrow.io also exposes in `values`.
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
 * Daily aggregation compatible with Tomorrow.io `timesteps=1d` (5-day window on Free tier)
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
  location: WeatherLocationDto;
  timeZoneId: string;
  fetchedAtUtc: string;
  current: CurrentWeatherDto;
  /** Up to 48 hourly entries (Today + Tomorrow) in ascending `startUtc` order. */
  hourly: HourlyForecastPointDto[];
  /** 5 daily entries matching Tomorrow.io Free plan forecast window. */
  daily: DailyForecastPointDto[];
}

export interface WeatherLocationPreview {
  location: WeatherLocationDto;
  temperatureC: number;
  rainProbabilityPercent: number;
  rainMmPerHour: number;
  weatherCode: number;
  thunderstorm: boolean;
}
