import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ItineraryWeatherTipsCard } from '../components/ItineraryWeatherTipsCard';
import type { WeatherTipsDto } from '../types/schedulingTypes';

const TIPS: WeatherTipsDto = {
  date: '2026-11-25',
  timeZoneId: 'Asia/Ho_Chi_Minh',
  forecastAtUtc: '2026-11-24T03:00:00Z',
  summary: { minTempC: 22, maxTempC: 31, maxRainProbabilityPercent: 60, maxUvIndex: 8 },
  tips: [
    { code: 'weather_tip.storm', severity: 'Warning', text: 'Có dông hoặc mưa to, cân nhắc đổi sang điểm trong nhà' },
    { code: 'weather_tip.rain', severity: 'Info', text: 'Mang ô hoặc áo mưa' },
    { code: 'weather_tip.uv', severity: 'Info', text: 'Mang kem chống nắng và kính râm' },
  ],
};

describe('ItineraryWeatherTipsCard', () => {
  afterEach(() => cleanup());

  it('exposes a region named "Gợi ý theo thời tiết"', () => {
    render(<ItineraryWeatherTipsCard tips={TIPS} />);

    expect(screen.getByRole('region', { name: 'Gợi ý theo thời tiết' })).toBeTruthy();
  });

  it('shows the title with day and month from date, whatever the browser time zone', () => {
    render(<ItineraryWeatherTipsCard tips={{ ...TIPS, date: '2026-11-25' }} />);

    expect(screen.getByText('Thời tiết ngày 25/11')).toBeTruthy();
  });

  it('keeps a first-of-month date on its own day', () => {
    render(<ItineraryWeatherTipsCard tips={{ ...TIPS, date: '2026-12-01' }} />);

    expect(screen.getByText('Thời tiết ngày 01/12')).toBeTruthy();
  });

  it('shows the summary line', () => {
    render(<ItineraryWeatherTipsCard tips={TIPS} />);

    expect(screen.getByText('22–31°C · Mưa tối đa 60% · UV 8')).toBeTruthy();
  });

  it('lists the tips in the received order with the backend text', () => {
    render(<ItineraryWeatherTipsCard tips={TIPS} />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Có dông hoặc mưa to, cân nhắc đổi sang điểm trong nhà'),
      expect.stringContaining('Mang ô hoặc áo mưa'),
      expect.stringContaining('Mang kem chống nắng và kính râm'),
    ]);
  });

  it('marks a Warning tip with data-severity and a warning icon, and an Info tip without', () => {
    render(<ItineraryWeatherTipsCard tips={TIPS} />);

    const [warning, info] = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(warning.getAttribute('data-severity')).toBe('Warning');
    expect(warning.querySelector('.material-symbols-outlined')?.textContent).toBe('warning');
    expect(warning.className).toContain('bg-amber-50');
    expect(info.getAttribute('data-severity')).toBeNull();
    expect(info.querySelector('.material-symbols-outlined')?.textContent).not.toBe('warning');
  });

  it('shows the empty sentence and no list when there are no tips', () => {
    render(<ItineraryWeatherTipsCard tips={{ ...TIPS, tips: [] }} />);

    expect(screen.getByText('Thời tiết thuận lợi, không cần chuẩn bị đặc biệt.')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByText('22–31°C · Mưa tối đa 60% · UV 8')).toBeTruthy();
  });

  it('does not show the empty sentence when there are tips', () => {
    render(<ItineraryWeatherTipsCard tips={TIPS} />);

    expect(screen.queryByText('Thời tiết thuận lợi, không cần chuẩn bị đặc biệt.')).toBeNull();
  });

  it('hides decorative icons from assistive technology', () => {
    const { container } = render(<ItineraryWeatherTipsCard tips={TIPS} />);

    container.querySelectorAll('.material-symbols-outlined').forEach((icon) => {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });
});