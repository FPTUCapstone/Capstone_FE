import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WeatherForecastPage } from '../components/WeatherForecastPage';
import * as weatherApi from '../services/weatherForecastApi';

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: routerMocks.replace,
    push: routerMocks.push,
  }),
  useSearchParams: () => routerMocks.searchParams,
}));

vi.mock('@/features/public/landing/components/PublicFooter', () => ({
  PublicFooter: () => <footer data-testid="public-footer">Footer</footer>,
}));

describe('WeatherForecastPage', () => {
  beforeEach(() => {
    routerMocks.replace.mockReset();
    routerMocks.push.mockReset();
    routerMocks.searchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders current weather, metric cards, hourly chart, and 5-day forecast for Da Nang by default', async () => {
    render(<WeatherForecastPage />);

    await waitFor(() => {
      expect(screen.getByTestId('current-temperature')).toBeDefined();
    });

    expect(screen.getByRole('heading', { level: 1, name: /Dự báo thời tiết Miền Trung/i })).toBeDefined();
    expect(screen.getByTestId('weather-source-badge').textContent).toContain('Tomorrow.io');
    expect(screen.getByRole('region', { name: /Thời tiết hiện tại tại Đà Nẵng/i })).toBeDefined();
    expect(screen.getByRole('region', { name: /Dự báo thời tiết theo giờ/i })).toBeDefined();
    expect(screen.getByRole('region', { name: /Dự báo thời tiết 5 ngày tới/i })).toBeDefined();
  });

  it('updates URL query when selecting another Central Vietnam destination', async () => {
    render(<WeatherForecastPage />);

    const hueButton = await screen.findByRole('button', { name: /Cố Đô Huế/i });
    fireEvent.click(hueButton);

    expect(routerMocks.replace).toHaveBeenCalledWith('/weather?location=hue', { scroll: false });
  });

  it('switches hourly metric tabs (Temperature, Rain, UV, Wind) and updates selected hour inspector', async () => {
    render(<WeatherForecastPage />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-hour-summary')).toBeDefined();
    });

    const rainTab = screen.getByRole('tab', { name: /Mưa/i });
    fireEvent.click(rainTab);
    expect(rainTab.getAttribute('aria-selected')).toBe('true');

    const uvTab = screen.getByRole('tab', { name: /Chỉ số UV/i });
    fireEvent.click(uvTab);
    expect(uvTab.getAttribute('aria-selected')).toBe('true');

    const hourOptions = screen.getAllByRole('option');
    expect(hourOptions.length).toBe(24);
    fireEvent.click(hourOptions[3]);
    expect(hourOptions[3].getAttribute('aria-selected')).toBe('true');
  });

  it('expands a selected day in the 5-day forecast list without resetting the active hourly metric tab', async () => {
    render(<WeatherForecastPage />);

    const rainTab = await screen.findByRole('tab', { name: /Mưa/i });
    fireEvent.click(rainTab);
    expect(rainTab.getAttribute('aria-selected')).toBe('true');

    const tomorrowBtn = await screen.findByRole('button', { name: /Ngày mai/i });
    expect(tomorrowBtn.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(tomorrowBtn);
    expect(tomorrowBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Tổng lượng mưa')).toBeDefined();
    expect(screen.getByText('Cảm giác cao nhất')).toBeDefined();
    expect(screen.getByRole('tab', { name: /Mưa/i }).getAttribute('aria-selected')).toBe('true');
  });

  it('shows error state with retry action when the weather service rejects', async () => {
    vi.spyOn(weatherApi, 'getWeatherForecast').mockRejectedValueOnce(
      new weatherApi.WeatherForecastApiError('Dịch vụ dữ liệu khí tượng tạm thời gián đoạn.', 503),
    );

    render(<WeatherForecastPage />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Dịch vụ dữ liệu khí tượng tạm thời gián đoạn.');

    const retryBtn = screen.getByRole('button', { name: /Thử tải lại/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('current-temperature')).toBeDefined();
    });
  });
});
