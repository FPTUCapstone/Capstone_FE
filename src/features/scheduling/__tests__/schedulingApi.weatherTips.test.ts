import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getItineraryWeatherTips } from '../services/schedulingApi';
import { parseWeatherTipsResponse, type WeatherTipsDto } from '../types/schedulingTypes';

const TIPS: WeatherTipsDto = {
  date: '2026-11-25',
  timeZoneId: 'Asia/Ho_Chi_Minh',
  forecastAtUtc: '2026-11-24T03:00:00Z',
  summary: { minTempC: 22, maxTempC: 31, maxRainProbabilityPercent: 60, maxUvIndex: 8 },
  tips: [
    { code: 'weather_tip.storm', severity: 'Warning', text: 'Có dông hoặc mưa to, cân nhắc đổi sang điểm trong nhà' },
    { code: 'weather_tip.rain', severity: 'Info', text: 'Mang ô hoặc áo mưa' },
  ],
};

function respond(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValueOnce({ ok: status >= 200 && status < 300, status, json: async () => body });
}

describe('UC-10 weather tips API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns the tips on 200', async () => {
    respond(200, { weatherTips: TIPS });

    await expect(getItineraryWeatherTips(42, { accessToken: 'tok' })).resolves.toEqual(TIPS);
  });

  it('sends the bearer token and calls /itineraries/42/weather-tips', async () => {
    respond(200, { weatherTips: TIPS });

    await getItineraryWeatherTips(42, { accessToken: 'traveler-token' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/itineraries/42/weather-tips'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer traveler-token' }),
      }),
    );
  });

  it('returns null for { weatherTips: null }', async () => {
    respond(200, { weatherTips: null });

    await expect(getItineraryWeatherTips(42, { accessToken: 'tok' })).resolves.toBeNull();
  });

  it.each([401, 403, 404, 500])('returns null for HTTP %i', async (status) => {
    respond(status, { title: 'nope' });

    await expect(getItineraryWeatherTips(42, { accessToken: 'tok' })).resolves.toBeNull();
  });

  it('returns null when the network is down', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(getItineraryWeatherTips(42, { accessToken: 'tok' })).resolves.toBeNull();
  });

  it('returns null when the body is not JSON', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });

    await expect(getItineraryWeatherTips(42, { accessToken: 'tok' })).resolves.toBeNull();
  });

  it('rejects with AbortError when aborted', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
    const controller = new AbortController();

    await expect(
      getItineraryWeatherTips(42, { accessToken: 'tok', signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it.each([0, -1, 1.5, Number.NaN])('does not call the server for the invalid id %s', async (id) => {
    global.fetch = vi.fn();

    await expect(getItineraryWeatherTips(id, { accessToken: 'tok' })).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('parseWeatherTipsResponse', () => {
  it('accepts a complete payload and an empty tip list', () => {
    expect(parseWeatherTipsResponse({ weatherTips: TIPS })).toEqual(TIPS);
    expect(parseWeatherTipsResponse({ weatherTips: { ...TIPS, tips: [] } })?.tips).toEqual([]);
  });

  it.each([
    ['a null body', null],
    ['no weatherTips field', {}],
    ['weatherTips null', { weatherTips: null }],
    ['no summary', { weatherTips: { ...TIPS, summary: undefined } }],
    ['a summary field that is not a number', { weatherTips: { ...TIPS, summary: { ...TIPS.summary, maxUvIndex: '8' } } }],
    ['tips that is not an array', { weatherTips: { ...TIPS, tips: 'Mang ô' } }],
    ['an unknown severity', { weatherTips: { ...TIPS, tips: [{ code: 'x', severity: 'Critical', text: 'y' }] } }],
    ['a tip without text', { weatherTips: { ...TIPS, tips: [{ code: 'x', severity: 'Info' }] } }],
    ['a date in another format', { weatherTips: { ...TIPS, date: '25/11/2026' } }],
    ['a non-string time zone', { weatherTips: { ...TIPS, timeZoneId: 7 } }],
  ])('returns null for %s', (_name, body) => {
    expect(parseWeatherTipsResponse(body)).toBeNull();
  });
});