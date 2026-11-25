'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { PublicFooter } from '@/features/public/landing/components/PublicFooter';
import { ROUTES } from '@/lib/routes';

import {
  DEFAULT_WEATHER_LOCATION_ID,
  resolveWeatherLocation,
} from '../data/mockWeatherFixtures';
import {
  getWeatherForecast,
  getWeatherLocationPreviews,
  WeatherForecastApiError,
} from '../services/weatherForecastApi';
import type {
  WeatherForecastResponseDto,
  WeatherLocationPreview,
} from '../types/weatherForecast';
import {
  formatDailyLabel,
  formatLocalTime,
  getLocalDateKey,
} from '../utils/weatherFormat';
import { CurrentWeatherHero } from './CurrentWeatherHero';
import { DailyForecastList } from './DailyForecastList';
import { HourlyForecastSection } from './HourlyForecastSection';
import { WeatherLocationStrip } from './WeatherLocationStrip';
import { WeatherMetricsGrid } from './WeatherMetricsGrid';
import { WeatherErrorState, WeatherPageSkeleton } from './WeatherStates';

type ForecastLoadState =
  | { key: string; status: 'success'; data: WeatherForecastResponseDto }
  | { key: string; status: 'error'; message: string };

export function WeatherForecastPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationParam = searchParams.get('location');
  const activeLocation = useMemo(
    () => resolveWeatherLocation(locationParam ?? DEFAULT_WEATHER_LOCATION_ID),
    [locationParam],
  );

  const [refreshTick, setRefreshTick] = useState(0);
  const [forecastState, setForecastState] = useState<ForecastLoadState | null>(null);
  const [previews, setPreviews] = useState<WeatherLocationPreview[]>([]);
  const [selectedDateOverride, setSelectedDateOverride] = useState<{
    locationId: string;
    date: string;
  } | null>(null);

  const requestKey = `${activeLocation.id}:${refreshTick}`;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    getWeatherForecast(activeLocation.id, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setForecastState({ key: requestKey, status: 'success', data });
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message =
          err instanceof WeatherForecastApiError
            ? err.message
            : 'Không thể tải dữ liệu dự báo thời tiết vào lúc này.';
        setForecastState({ key: requestKey, status: 'error', message });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [activeLocation.id, requestKey]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    getWeatherLocationPreviews({ signal: controller.signal })
      .then((items) => {
        if (!active) return;
        setPreviews(items);
      })
      .catch(() => {
        // Preview strip is non-blocking; ignore background refresh abort/error
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshTick]);

  const handleSelectLocation = useCallback(
    (nextLocationId: string) => {
      const resolved = resolveWeatherLocation(nextLocationId);
      if (resolved.id === activeLocation.id) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('location', resolved.id);
      router.replace(`${ROUTES.weather}?${params.toString()}`, { scroll: false });
    },
    [activeLocation.id, router, searchParams],
  );

  const handleRefresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  const currentResult = forecastState?.key === requestKey ? forecastState : null;
  const forecast =
    currentResult?.status === 'success'
      ? currentResult.data
      : forecastState?.status === 'success'
        ? forecastState.data
        : null;
  const isInitialLoading = forecastState === null;
  const isRefreshing = currentResult === null && forecast !== null;

  const todayDateKey = forecast?.daily[0]?.date ?? '';
  const selectedDate =
    selectedDateOverride &&
    selectedDateOverride.locationId === activeLocation.id &&
    forecast?.daily.some((d) => d.date === selectedDateOverride.date)
      ? selectedDateOverride.date
      : todayDateKey;

  const hourlyByDate = useMemo(() => {
    const map = new Map<string, WeatherForecastResponseDto['hourly']>();
    if (!forecast) return map;
    for (const slot of forecast.hourly) {
      const key = getLocalDateKey(slot.startUtc, forecast.timeZoneId);
      const list = map.get(key);
      if (list) list.push(slot);
      else map.set(key, [slot]);
    }
    return map;
  }, [forecast]);

  const hourlyAvailableDates = useMemo(() => {
    const set = new Set<string>();
    for (const [dateKey, list] of hourlyByDate.entries()) {
      if (list.length >= 6) {
        set.add(dateKey);
      }
    }
    return set;
  }, [hourlyByDate]);

  const { displayedHourly, hourlyRangeLabel, isTodayRange } = useMemo(() => {
    if (!forecast) {
      return { displayedHourly: [], hourlyRangeLabel: '24 giờ tới', isTodayRange: true };
    }
    if (!selectedDate || selectedDate === todayDateKey) {
      return {
        displayedHourly: forecast.hourly.slice(0, 24),
        hourlyRangeLabel: '24 giờ tới',
        isTodayRange: true,
      };
    }
    const daySlots = hourlyByDate.get(selectedDate);
    if (daySlots && daySlots.length >= 6) {
      const idx = forecast.daily.findIndex((d) => d.date === selectedDate);
      const label = formatDailyLabel(selectedDate, Math.max(0, idx));
      return {
        displayedHourly: daySlots,
        hourlyRangeLabel: `${label.primary} (${label.secondary})`,
        isTodayRange: false,
      };
    }
    return {
      displayedHourly: forecast.hourly.slice(0, 24),
      hourlyRangeLabel: '24 giờ tới',
      isTodayRange: true,
    };
  }, [forecast, hourlyByDate, selectedDate, todayDateKey]);

  const todaySummary = forecast?.daily[0];
  const isMockSource = forecast?.source !== 'api';

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5EF]" lang="vi">
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: ROUTES.home },
            { label: 'Dự báo thời tiết' },
          ]}
          title={
            <>
              Dự báo thời tiết <span className="text-[#174B4A]">Miền Trung</span>
            </>
          }
          badge={
            <span
              data-testid="weather-source-badge"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#CBE0D4] bg-[#E8F0EA] px-2.5 py-0.5 text-xs font-bold text-[#103B39]"
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                {isMockSource ? 'science' : 'sensors'}
              </span>
              <span>
                {isMockSource
                  ? 'Chuẩn Tomorrow.io · Dữ liệu mẫu FE'
                  : 'Tomorrow.io · Dữ liệu trực tiếp'}
              </span>
            </span>
          }
          description="Theo dõi thời tiết hiện tại, diễn biến từng giờ và dự báo 5 ngày tới tại các điểm đến Miền Trung để chủ động lên kế hoạch du lịch."
          actions={
            <>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2 text-xs font-bold text-[#1C2928] shadow-2xs transition hover:border-[#174B4A]/60 hover:bg-[#E8F0EA]/50 disabled:cursor-wait disabled:opacity-60"
              >
                <span
                  className={`material-symbols-outlined text-sm text-[#174B4A] ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                  aria-hidden="true"
                >
                  refresh
                </span>
                <span>
                  {forecast
                    ? `Cập nhật ${formatLocalTime(forecast.fetchedAtUtc, forecast.timeZoneId)}`
                    : 'Làm mới'}
                </span>
              </button>

              <Link
                href={ROUTES.plan}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#103B39] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A]"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  calendar_month
                </span>
                <span>Lập lịch trình</span>
              </Link>
            </>
          }
        />

        <div className="mt-5 space-y-5">
          {previews.length > 0 ? (
            <WeatherLocationStrip
              previews={previews}
              selectedLocationId={activeLocation.id}
              onSelectLocation={handleSelectLocation}
            />
          ) : null}

          {isInitialLoading ? (
            <WeatherPageSkeleton />
          ) : currentResult?.status === 'error' ? (
            <WeatherErrorState message={currentResult.message} onRetry={handleRefresh} />
          ) : forecast ? (
            <>
              {/* Hero + Detailed Metric Cards */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <CurrentWeatherHero
                    location={forecast.location}
                    current={forecast.current}
                    todaySummary={todaySummary}
                    timeZoneId={forecast.timeZoneId}
                  />
                </div>
                <div className="lg:col-span-5">
                  <WeatherMetricsGrid
                    current={forecast.current}
                    todaySummary={todaySummary}
                    todayHourly={forecast.hourly.slice(0, 24)}
                    timeZoneId={forecast.timeZoneId}
                  />
                </div>
              </div>

              {/* Interactive Hourly Forecast Chart & Timeline */}
              <HourlyForecastSection
                hourly={displayedHourly}
                timeZoneId={forecast.timeZoneId}
                rangeLabel={hourlyRangeLabel}
                isTodayRange={isTodayRange}
              />

              {/* 5-Day Forecast */}
              <DailyForecastList
                daily={forecast.daily}
                selectedDate={selectedDate}
                onSelectDate={(date) =>
                  setSelectedDateOverride({ locationId: activeLocation.id, date })
                }
                hourlyAvailableDates={hourlyAvailableDates}
              />

              {/* Subtle Journey Planning Handoff Strip */}
              <section
                aria-label="Kết nối lịch trình du lịch"
                className="flex flex-col justify-between gap-4 rounded-3xl border border-[#DCE2DD] bg-white px-5 py-4 shadow-2xs sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EA] text-[#174B4A]">
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      explore
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1C2928]">
                      Sẵn sàng lên lịch trình cho {forecast.location.name}?
                    </h3>
                    <p className="mt-0.5 text-xs text-[#5B6E69]">
                      Kết hợp dự báo thời tiết theo giờ với bộ lập lịch thông minh của TripMate để chọn điểm tham quan phù hợp.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={ROUTES.pois}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-3.5 py-2 text-xs font-bold text-[#1C2928] transition hover:border-[#174B4A] hover:bg-[#E8F0EA]"
                  >
                    <span>Khám phá địa điểm</span>
                  </Link>
                  <Link
                    href={ROUTES.plan}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#174B4A] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#103B39]"
                  >
                    <span>Tạo lịch trình ngay</span>
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>

      <div className="mt-10">
        <PublicFooter />
      </div>
    </div>
  );
}
