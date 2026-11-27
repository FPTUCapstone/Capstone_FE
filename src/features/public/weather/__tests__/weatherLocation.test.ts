import { describe, expect, it } from 'vitest';
import { DEFAULT_WEATHER_LOCATION } from '../data/suggestedLocations';
import {
  buildWeatherLocationQuery,
  isWithinVietnamBounds,
  parseWeatherLocationFromSearchParams,
} from '../utils/weatherLocation';

describe('weatherLocation', () => {
  describe('isWithinVietnamBounds', () => {
    it('accepts coordinates inside Vietnam and on exact bounding box edges', () => {
      expect(isWithinVietnamBounds(16.0544, 108.2022)).toBe(true);
      expect(isWithinVietnamBounds(22.34, 103.84)).toBe(true);
      expect(isWithinVietnamBounds(6, 102)).toBe(true);
      expect(isWithinVietnamBounds(24, 118)).toBe(true);
    });

    it('rejects coordinates outside Vietnam or non-finite values', () => {
      expect(isWithinVietnamBounds(5.99, 108.2)).toBe(false);
      expect(isWithinVietnamBounds(24.01, 108.2)).toBe(false);
      expect(isWithinVietnamBounds(16.05, 101.99)).toBe(false);
      expect(isWithinVietnamBounds(16.05, 118.01)).toBe(false);
      expect(isWithinVietnamBounds(48.8566, 2.3522)).toBe(false);
      expect(isWithinVietnamBounds(Number.NaN, 108.2)).toBe(false);
      expect(isWithinVietnamBounds(16.05, Number.POSITIVE_INFINITY)).toBe(false);
    });
  });

  describe('parseWeatherLocationFromSearchParams', () => {
    it('defaults to Da Nang when query params are empty', () => {
      const location = parseWeatherLocationFromSearchParams(new URLSearchParams());
      expect(location).toEqual(DEFAULT_WEATHER_LOCATION);
    });

    it('parses custom Vietnam coordinates and name from URL query', () => {
      const params = new URLSearchParams('lat=22.34&lon=103.84&name=Sa%20Pa');
      const location = parseWeatherLocationFromSearchParams(params);

      expect(location.id).toBeUndefined();
      expect(location.name).toBe('Sa Pa');
      expect(location.latitude).toBe(22.34);
      expect(location.longitude).toBe(103.84);
      expect(location.timeZoneId).toBe('Asia/Ho_Chi_Minh');
    });

    it('matches rounded suggested-location URL back to suggested metadata', () => {
      const params = new URLSearchParams('lat=15.88&lon=108.34&name=H%E1%BB%99i%20An');
      const location = parseWeatherLocationFromSearchParams(params);

      expect(location.id).toBe('hoian');
      expect(location.name).toBe('Hội An');
      expect(location.region).toBe('Tỉnh Quảng Nam');
      expect(location.subtitle).toBe('Phố cổ Hội An & Sông Hoài');
    });

    it('uses coordinate label when valid Vietnam coords are passed without name', () => {
      const params = new URLSearchParams('lat=21.03&lon=105.85');
      const location = parseWeatherLocationFromSearchParams(params);

      expect(location.latitude).toBe(21.03);
      expect(location.longitude).toBe(105.85);
      expect(location.name).toBe('21.03°B, 105.85°Đ');
    });

    it('falls back to Da Nang when URL coordinates are invalid or outside Vietnam', () => {
      expect(
        parseWeatherLocationFromSearchParams(new URLSearchParams('lat=48.85&lon=2.35&name=Paris')),
      ).toEqual(DEFAULT_WEATHER_LOCATION);
      expect(
        parseWeatherLocationFromSearchParams(new URLSearchParams('lat=abc&lon=108.2')),
      ).toEqual(DEFAULT_WEATHER_LOCATION);
    });
  });

  describe('buildWeatherLocationQuery', () => {
    it('formats shareable lat, lon (2 decimals) and URI-encoded name', () => {
      expect(
        buildWeatherLocationQuery({
          latitude: 22.3364,
          longitude: 103.8438,
          name: 'Sa Pa',
        }),
      ).toBe('lat=22.34&lon=103.84&name=Sa%20Pa');
    });

    it('round-trips through URLSearchParams cleanly', () => {
      const query = buildWeatherLocationQuery({
        latitude: 10.2899,
        longitude: 103.984,
        name: 'Phú Quốc',
      });
      const parsed = parseWeatherLocationFromSearchParams(new URLSearchParams(query));

      expect(parsed.name).toBe('Phú Quốc');
      expect(parsed.latitude).toBe(10.29);
      expect(parsed.longitude).toBe(103.98);
    });
  });
});
