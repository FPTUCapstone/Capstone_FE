import { describe, expect, it } from 'vitest';
import type { HourlyForecastPointDto } from '../types/weatherForecast';
import {
  classifyRainIntensity,
  classifyUvIndex,
  classifyWindSpeed,
  describeWeatherCode,
  findBestOutdoorWindow,
  formatDailyLabel,
  formatDecimalVi,
} from '../utils/weatherFormat';

describe('weatherFormat', () => {
  it('maps Tomorrow.io weather codes and thunderstorm flag accurately', () => {
    expect(describeWeatherCode(1000, false, false).group).toBe('clear');
    expect(describeWeatherCode(1000, false, true).icon).toBe('clear_night');
    expect(describeWeatherCode(4001, false).labelVi).toBe('Có mưa vừa');
    expect(describeWeatherCode(8000, false).group).toBe('storm');
    expect(describeWeatherCode(1101, true).group).toBe('storm');
  });

  it('classifies rain thresholds matching Capstone_BE WeatherAlertPolicy', () => {
    expect(classifyRainIntensity(0).level).toBe('none');
    expect(classifyRainIntensity(0.2).level).toBe('light');
    expect(classifyRainIntensity(2.5).level).toBe('moderate');
    expect(classifyRainIntensity(10).level).toBe('heavy');
    expect(classifyRainIntensity(50).level).toBe('extreme');
    expect(classifyRainIntensity(0, true).level).toBe('storm');
  });

  it('classifies UV index levels across Tomorrow.io scale', () => {
    expect(classifyUvIndex(1).level).toBe('low');
    expect(classifyUvIndex(4).level).toBe('moderate');
    expect(classifyUvIndex(6).level).toBe('high');
    expect(classifyUvIndex(9).level).toBe('very-high');
    expect(classifyUvIndex(11).level).toBe('extreme');
  });

  it('converts m/s wind speeds to km/h and classifies strength', () => {
    const gentle = classifyWindSpeed(3);
    expect(gentle.kmPerHour).toBe(11);
    expect(gentle.labelVi).toBe('Gió nhẹ');

    const strong = classifyWindSpeed(10.5);
    expect(strong.kmPerHour).toBe(38);
    expect(strong.labelVi).toBe('Gió mạnh');
  });

  it('formats Vietnamese decimals and 5-day labels cleanly', () => {
    expect(formatDecimalVi(4.2)).toBe('4,2');
    expect(formatDailyLabel('2026-11-25', 0)).toEqual({ primary: 'Hôm nay', secondary: '25/11' });
    expect(formatDailyLabel('2026-11-26', 1)).toEqual({ primary: 'Ngày mai', secondary: '26/11' });
    expect(formatDailyLabel('2026-11-27', 2).secondary).toBe('27/11');
  });

  it('computes a best daylight outdoor window from hourly data', () => {
    const startMs = Date.parse('2026-11-25T01:00:00Z'); // 08:00 GMT+7
    const hourly: HourlyForecastPointDto[] = Array.from({ length: 8 }, (_, idx) => ({
      startUtc: new Date(startMs + idx * 3600_000).toISOString(),
      temperatureC: 26 + (idx % 3),
      apparentTemperatureC: 27 + (idx % 3),
      rainProbabilityPercent: idx >= 4 ? 70 : 10,
      rainMmPerHour: idx >= 4 ? 3.5 : 0,
      uvIndex: 4,
      windSpeedMps: 3.2,
      thunderstorm: false,
      weatherCode: idx >= 4 ? 4001 : 1100,
      humidityPercent: 72,
      cloudCoverPercent: 35,
      visibilityKm: 15,
    }));

    const best = findBestOutdoorWindow(hourly, 'Asia/Ho_Chi_Minh');
    expect(best).not.toBeNull();
    expect(best?.rangeLabel).toMatch(/^\d{2}:\d{2} – \d{2}:\d{2}$/);
  });
});
