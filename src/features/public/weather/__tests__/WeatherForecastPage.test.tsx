import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage, type WebAuthContext } from '@/features/auth/session/authSession';
import * as placeSearchApi from '@/features/scheduling/services/placeSearchApi';
import { WeatherForecastPage } from '../components/WeatherForecastPage';
import * as weatherApi from '../services/weatherForecastApi';
import type {
  UpcomingTripWeatherDto,
  WeatherForecastResponseDto,
} from '../types/weatherForecast';

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

vi.mock('@/features/scheduling/services/placeSearchApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/scheduling/services/placeSearchApi')>();
  return {
    ...actual,
    isAddressSearchAvailable: vi.fn(() => true),
    createAddressSession: vi.fn(() => 'session-test'),
    suggestAddresses: vi.fn(async () => []),
    retrieveAddress: vi.fn(),
    getBrowserLocation: vi.fn(),
  };
});

function makeForecast(
  overrides: {
    latitude?: number;
    longitude?: number;
    temperatureC?: number;
    hourlyCount?: number;
    dailyCount?: number;
  } = {},
): WeatherForecastResponseDto {
  const latitude = overrides.latitude ?? 16.05;
  const longitude = overrides.longitude ?? 108.2;
  const temperatureC = overrides.temperatureC ?? 25.1;
  const hourlyCount = overrides.hourlyCount ?? 24;
  const dailyCount = overrides.dailyCount ?? 5;
  const baseMs = Date.parse('2026-11-26T06:00:00Z');

  const hourly = Array.from({ length: hourlyCount }, (_, idx) => ({
    startUtc: new Date(baseMs + idx * 3600_000).toISOString(),
    temperatureC: Math.round((temperatureC + (idx % 4) * 0.5) * 10) / 10,
    apparentTemperatureC: Math.round((temperatureC + 1) * 10) / 10,
    rainProbabilityPercent: idx === 3 ? 60 : 20,
    rainMmPerHour: idx === 3 ? 1.5 : 0,
    uvIndex: idx < 6 ? 4 : 0,
    windSpeedMps: 3.2,
    thunderstorm: false,
    weatherCode: idx === 3 ? 4200 : 1101,
    humidityPercent: 76,
    cloudCoverPercent: 55,
    visibilityKm: 15,
  }));

  const daily = Array.from({ length: dailyCount }, (_, idx) => {
    const day = 26 + idx;
    return {
      date: `2026-11-${String(day).padStart(2, '0')}`,
      minTempC: Math.round(temperatureC - 3),
      maxTempC: Math.round(temperatureC + 3),
      maxApparentTempC: Math.round(temperatureC + 4),
      maxRainProbabilityPercent: idx === 1 ? 65 : 30,
      maxRainMmPerHour: idx === 1 ? 2.8 : 0.4,
      totalRainMm: idx === 1 ? 9.2 : 1.1,
      maxUvIndex: 6,
      maxWindSpeedMps: 5.5,
      thunderstorm: false,
      weatherCode: idx === 1 ? 4001 : 1101,
      humidityAvgPercent: 78,
      sunriseTime: '05:56',
      sunsetTime: '17:13',
    };
  });

  return {
    source: 'api',
    provider: 'Tomorrow.io',
    location: { latitude, longitude, timeZoneId: 'Asia/Ho_Chi_Minh' },
    timeZoneId: 'Asia/Ho_Chi_Minh',
    fetchedAtUtc: '2026-11-26T06:05:51.57Z',
    current: {
      observedAtUtc: '2026-11-26T06:00:00Z',
      temperatureC,
      apparentTemperatureC: temperatureC + 0.5,
      rainProbabilityPercent: 35,
      rainMmPerHour: 0.07,
      uvIndex: 3,
      windSpeedMps: 2.9,
      thunderstorm: false,
      weatherCode: 1001,
      humidityPercent: 77,
      visibilityKm: 16,
      cloudCoverPercent: 80,
    },
    hourly,
    daily,
  };
}

describe('WeatherForecastPage', () => {
  beforeEach(() => {
    routerMocks.replace.mockReset();
    routerMocks.push.mockReset();
    routerMocks.searchParams = new URLSearchParams();
    AuthStorage.clear();
    vi.mocked(placeSearchApi.isAddressSearchAvailable).mockReturnValue(true);
    vi.spyOn(weatherApi, 'getWeatherForecast').mockResolvedValue(makeForecast());
    vi.spyOn(weatherApi, 'getWeatherLocationPreviews').mockResolvedValue([]);
    vi.spyOn(weatherApi, 'getUpcomingTripWeather').mockResolvedValue([]);
  });

  afterEach(() => {
    AuthStorage.clear();
    vi.useRealTimers();
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders live Da Nang forecast without mock badge and uses nationwide title + current-hour forecast label', async () => {
    render(<WeatherForecastPage />);

    await waitFor(() => {
      expect(screen.getByTestId('current-temperature').textContent).toBe('25°');
    });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent?.trim()).toBe('Dự báo thời tiết');
    expect(screen.queryByText(/Dữ liệu mẫu FE/i)).toBeNull();
    expect(screen.queryByTestId('weather-source-badge')).toBeNull();
    expect(screen.getByText(/Dự báo cho giờ hiện tại/i)).toBeDefined();
    expect(screen.getByText(/Cập nhật lúc/i)).toBeDefined();
    expect(screen.getByRole('region', { name: /Thời tiết hiện tại tại Đà Nẵng/i })).toBeDefined();
    expect(screen.getByRole('region', { name: /Dự báo thời tiết theo giờ/i })).toBeDefined();
    expect(screen.getByRole('region', { name: /Dự báo thời tiết 5 ngày tới/i })).toBeDefined();
  });

  it('updates shareable URL with lat, lon, and name when clicking a suggested destination chip', async () => {
    render(<WeatherForecastPage />);

    const hueButton = await screen.findByRole('button', { name: /Cố Đô Huế/i });
    fireEvent.click(hueButton);

    expect(routerMocks.replace).toHaveBeenCalledWith(
      '/weather?lat=16.46&lon=107.59&name=C%E1%BB%91%20%C4%90%C3%B4%20Hu%E1%BA%BF',
      { scroll: false },
    );
  });

  it('loads location from shareable URL (?lat=22.34&lon=103.84&name=Sa%20Pa) and displays Sa Pa', async () => {
    routerMocks.searchParams = new URLSearchParams('lat=22.34&lon=103.84&name=Sa%20Pa');
    const forecastSpy = vi.spyOn(weatherApi, 'getWeatherForecast').mockResolvedValue(
      makeForecast({ latitude: 22.34, longitude: 103.84, temperatureC: 13.2 }),
    );

    render(<WeatherForecastPage />);

    await waitFor(() => {
      expect(screen.getByTestId('current-temperature').textContent).toBe('13°');
    });

    expect(forecastSpy).toHaveBeenCalledWith(
      { latitude: 22.34, longitude: 103.84 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(screen.getByRole('region', { name: /Thời tiết hiện tại tại Sa Pa/i })).toBeDefined();
    expect(screen.getByText(/Sẵn sàng lên lịch trình cho Sa Pa\?/i)).toBeDefined();
  });

  it('searches via Mapbox combobox and updates URL when selecting a result', async () => {
    vi.mocked(placeSearchApi.suggestAddresses).mockResolvedValue([
      { id: 'mbx-sapa', name: 'Sa Pa', fullAddress: 'Thị xã Sa Pa, Lào Cai' },
    ]);
    vi.mocked(placeSearchApi.retrieveAddress).mockResolvedValue({
      label: 'Sa Pa, Thị xã Sa Pa, Lào Cai',
      latitude: 22.34,
      longitude: 103.84,
    });

    render(<WeatherForecastPage />);
    await waitFor(() => {
      expect(screen.getByTestId('current-temperature')).toBeDefined();
    });

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Sa Pa' } });

    const option = await screen.findByRole('option', { name: /Sa Pa/i });
    await act(async () => {
      fireEvent.click(option);
      await Promise.resolve();
    });

    expect(routerMocks.replace).toHaveBeenCalledWith(
      '/weather?lat=22.34&lon=103.84&name=Sa%20Pa',
      { scroll: false },
    );
  });

  it('switches hourly metric tabs and expands 5-day rows cleanly', async () => {
    render(<WeatherForecastPage />);

    const rainTab = await screen.findByRole('tab', { name: /Mưa/i });
    fireEvent.click(rainTab);
    expect(rainTab.getAttribute('aria-selected')).toBe('true');

    const hourOptions = screen.getAllByRole('option');
    expect(hourOptions.length).toBe(24);
    fireEvent.click(hourOptions[3]);
    expect(hourOptions[3].getAttribute('aria-selected')).toBe('true');

    const tomorrowBtn = screen.getByRole('button', { name: /Ngày mai/i });
    fireEvent.click(tomorrowBtn);
    expect(tomorrowBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Tổng lượng mưa')).toBeDefined();
  });

  it('renders cleanly when BE returns fewer than 24 hourly points or fewer than 5 daily points', async () => {
    vi.spyOn(weatherApi, 'getWeatherForecast').mockResolvedValue(
      makeForecast({ hourlyCount: 4, dailyCount: 2 }),
    );

    render(<WeatherForecastPage />);

    await waitFor(() => {
      expect(screen.getByTestId('current-temperature')).toBeDefined();
    });

    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Hôm nay/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Ngày mai/i })).toBeDefined();
  });

  it('shows 503 error state with retry button and recovers on retry without blank state', async () => {
    const forecastSpy = vi
      .spyOn(weatherApi, 'getWeatherForecast')
      .mockRejectedValueOnce(
        new weatherApi.WeatherForecastApiError(
          'Dịch vụ thời tiết đang bận, vui lòng thử lại sau ít phút.',
          503,
        ),
      )
      .mockResolvedValueOnce(makeForecast({ temperatureC: 26 }));

    render(<WeatherForecastPage />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Dịch vụ thời tiết đang bận, vui lòng thử lại sau ít phút.');

    fireEvent.click(screen.getByRole('button', { name: /Thử tải lại/i }));

    await waitFor(() => {
      expect(screen.getByTestId('current-temperature').textContent).toBe('26°');
    });
    expect(forecastSpy).toHaveBeenCalledTimes(2);
  });

  describe('personalized upcoming trip weather (Traveler only)', () => {
    function mockSession(role: WebAuthContext['role']) {
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      AuthStorage.accept(
        {
          userId: 42,
          email: 'traveler@tripmate.test',
          fullName: 'Nguyen Van A',
          role,
          status: 'Active',
          applicationStatus: role === 'TourOperator' ? 'Approved' : null,
          accessToken: 'test-access-token',
          accessTokenExpiresAtUtc: expiresAt,
        },
        false,
      );
    }

    const sampleTrip: UpcomingTripWeatherDto = {
      bookingId: 101,
      bookingCode: 'BK-0001',
      tourScheduleId: 1101,
      tourTitle: 'Tour Bà Nà',
      startAtUtc: '2026-11-27T23:30:00+00:00',
      endAtUtc: '2026-11-28T09:30:00+00:00',
      inProgress: false,
      point: {
        name: 'Bà Nà Hills',
        latitude: 15.9977,
        longitude: 107.9881,
      },
      forecastDate: '2026-11-28',
      forecast: {
        date: '2026-11-28',
        minTempC: 19,
        maxTempC: 24,
        maxApparentTempC: 25,
        maxRainProbabilityPercent: 80,
        maxRainMmPerHour: 3.5,
        totalRainMm: 12,
        maxUvIndex: 6,
        maxWindSpeedMps: 9,
        thunderstorm: true,
        weatherCode: 8000,
        humidityAvgPercent: 85,
        sunriseTime: '05:56',
        sunsetTime: '17:18',
      },
      warning: {
        reviewStatus: 'PendingAcknowledgement',
        eventType: 'Thunderstorm',
        severity: 'Severe',
        description: 'Dông lớn',
        validFromUtc: '2026-11-28T07:00:00+00:00',
        validToUtc: '2026-11-28T10:00:00+00:00',
        operatorInstructions: null,
      },
    };

    it('does not call upcoming-trip-weather for guests or non-Traveler roles', async () => {
      const upcomingSpy = vi.spyOn(weatherApi, 'getUpcomingTripWeather');

      render(<WeatherForecastPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-temperature')).toBeDefined();
      });
      expect(upcomingSpy).not.toHaveBeenCalled();
      expect(screen.queryByText('Chuyến đi sắp tới của bạn')).toBeNull();

      cleanup();
      mockSession('TourOperator');
      render(<WeatherForecastPage />);
      await waitFor(() => {
        expect(screen.getByTestId('current-temperature')).toBeDefined();
      });
      expect(upcomingSpy).not.toHaveBeenCalled();
      expect(screen.queryByText('Chuyến đi sắp tới của bạn')).toBeNull();
    });

    it('renders nothing personal when Traveler has no upcoming trips', async () => {
      mockSession('Traveler');
      const upcomingSpy = vi.spyOn(weatherApi, 'getUpcomingTripWeather').mockResolvedValue([]);

      render(<WeatherForecastPage />);
      await waitFor(() => {
        expect(upcomingSpy).toHaveBeenCalledWith(
          'test-access-token',
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
      });
      expect(screen.queryByText('Chuyến đi sắp tới của bạn')).toBeNull();
      expect(screen.getByTestId('current-temperature')).toBeDefined();
    });

    it('renders warning banner and upcoming trip card for signed-in Traveler and switches forecast when clicking card', async () => {
      mockSession('Traveler');
      vi.spyOn(weatherApi, 'getUpcomingTripWeather').mockResolvedValue([sampleTrip]);

      render(<WeatherForecastPage />);

      const banner = await screen.findByRole('status', { name: /Cảnh báo thời tiết Tour Bà Nà/i });
      expect(banner.textContent).toContain('Tour Bà Nà (28/11): Dông lớn.');
      expect(banner.textContent).toContain('Nhà điều hành đang xem xét.');
      expect(screen.getByText('Chuyến đi sắp tới của bạn')).toBeDefined();

      const tripCard = screen.getByRole('button', { name: /Tour Bà Nà/i });
      fireEvent.click(tripCard);

      expect(routerMocks.replace).toHaveBeenCalledWith(
        '/weather?lat=16&lon=107.99&name=B%C3%A0%20N%C3%A0%20Hills',
        { scroll: false },
      );
    });

    it('keeps main public weather forecast working if upcoming-trip-weather rejects or returns empty', async () => {
      mockSession('Traveler');
      vi.spyOn(weatherApi, 'getUpcomingTripWeather').mockRejectedValue(new Error('Network down'));

      render(<WeatherForecastPage />);

      await waitFor(() => {
        expect(screen.getByTestId('current-temperature').textContent).toBe('25°');
      });
      expect(screen.queryByText('Chuyến đi sắp tới của bạn')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});
