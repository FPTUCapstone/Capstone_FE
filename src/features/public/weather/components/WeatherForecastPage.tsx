'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { AuthStorage } from '@/features/auth/session/authSession';
import { PublicFooter } from '@/features/public/landing/components/PublicFooter';
import { ROUTES } from '@/lib/routes';

import { SUGGESTED_LOCATIONS } from '../data/suggestedLocations';
import {
  getUpcomingTripWeather,
  getWeatherForecast,
  getWeatherLocationPreviews,
  WeatherForecastApiError,
} from '../services/weatherForecastApi';
import type {
  UpcomingTripWeatherDto,
  WeatherForecastResponseDto,
  WeatherLocation,
} from '../types/weatherForecast';
import {
  formatDailyLabel,
  formatLocalTime,
  getLocalDateKey,
} from '../utils/weatherFormat';
import {
  buildWeatherLocationQuery,
  parseWeatherLocationFromSearchParams,
  weatherCoordinateKey,
} from '../utils/weatherLocation';
import { CurrentWeatherHero } from './CurrentWeatherHero';
import { DailyForecastList } from './DailyForecastList';
import { HourlyForecastSection } from './HourlyForecastSection';
import { UpcomingTripWeatherSection } from './UpcomingTripWeatherSection';
import { WeatherLocationSearch } from './WeatherLocationSearch';
import { WeatherLocationStrip } from './WeatherLocationStrip';
import { WeatherMetricsGrid } from './WeatherMetricsGrid';
import { WeatherErrorState, WeatherPageSkeleton } from './WeatherStates';

const subscribeAuth = (onChange: () => void) => AuthStorage.subscribe(onChange);
const getAuthSnapshot = () => AuthStorage.getContext();
const getServerAuthSnapshot = () => null;

type ForecastLoadState =
  | { key: string; status: 'success'; data: WeatherForecastResponseDto }
  | { key: string; status: 'error'; message: string };

export function WeatherForecastPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authContext = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );
  const travelerUserId = authContext?.role === 'Traveler' ? authContext.userId : null;

  const urlLocation = useMemo(
    () => parseWeatherLocationFromSearchParams(searchParams),
    [searchParams],
  );
  const urlCoordKey = weatherCoordinateKey(urlLocation);

  const [selectedMetaOverride, setSelectedMetaOverride] = useState<{
    coordKey: string;
    location: WeatherLocation;
  } | null>(null);

  const activeLocation = useMemo(() => {
    if (
      selectedMetaOverride &&
      selectedMetaOverride.coordKey === urlCoordKey &&
      selectedMetaOverride.location.name === urlLocation.name
    ) {
      return selectedMetaOverride.location;
    }
    return urlLocation;
  }, [selectedMetaOverride, urlCoordKey, urlLocation]);

  const [refreshTick, setRefreshTick] = useState(0);
  const [previewRetryTick, setPreviewRetryTick] = useState(0);
  const [forecastState, setForecastState] = useState<ForecastLoadState | null>(null);
  const [upcomingTripsState, setUpcomingTripsState] = useState<{
    userId: number;
    trips: UpcomingTripWeatherDto[];
  } | null>(null);
  const [temperaturesById, setTemperaturesById] = useState<Record<string, number>>({});
  const [selectedDateOverride, setSelectedDateOverride] = useState<{
    coordKey: string;
    date: string;
  } | null>(null);

  const initialActiveIdRef = useRef<string | undefined>(activeLocation.id);
  const previewsLoadedRef = useRef(false);

  const requestKey = `${urlCoordKey}:${refreshTick}`;

  // Fetch upcoming confirmed tour departures for signed-in Travelers only; errors stay silent.
  useEffect(() => {
    if (travelerUserId === null) {
      return;
    }
    const accessToken = AuthStorage.getAccessToken();
    if (!accessToken) {
      return;
    }

    let active = true;
    const controller = new AbortController();

    getUpcomingTripWeather(accessToken, { signal: controller.signal })
      .then((trips) => {
        if (!active) return;
        setUpcomingTripsState({ userId: travelerUserId, trips });
      })
      .catch(() => {
        // Personal upcoming trips are non-blocking and must never disrupt the public forecast.
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [travelerUserId]);

  const upcomingTrips =
    travelerUserId !== null && upcomingTripsState?.userId === travelerUserId
      ? upcomingTripsState.trips
      : [];

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    getWeatherForecast(
      { latitude: activeLocation.latitude, longitude: activeLocation.longitude },
      { signal: controller.signal },
    )
      .then((data) => {
        if (!active) return;
        setForecastState({ key: requestKey, status: 'success', data });
        if (activeLocation.id) {
          const matchedId = activeLocation.id;
          setTemperaturesById((prev) => ({
            ...prev,
            [matchedId]: data.current.temperatureC,
          }));
        }
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
  }, [activeLocation.id, activeLocation.latitude, activeLocation.longitude, requestKey]);

  // Load suggested chip temperatures once on mount (excluding the initial active location to save quota).
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const locationsToFetch = SUGGESTED_LOCATIONS.filter(
      (loc) => loc.id !== initialActiveIdRef.current,
    );

    getWeatherLocationPreviews({
      locations: locationsToFetch,
      signal: controller.signal,
    })
      .then((items) => {
        if (!active || items.length === 0) return;
        previewsLoadedRef.current = true;
        setTemperaturesById((prev) => {
          const next = { ...prev };
          for (const item of items) {
            if (item.location.id) {
              next[item.location.id] = item.temperatureC;
            }
          }
          return next;
        });
      })
      .catch(() => {
        // Quick-suggestion temperatures are progressive and non-blocking.
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [previewRetryTick]);

  const handleSelectLocation = useCallback(
    (nextLocation: WeatherLocation) => {
      const nextCoordKey = weatherCoordinateKey(nextLocation);
      if (nextCoordKey === urlCoordKey && nextLocation.name === activeLocation.name) {
        return;
      }

      setSelectedMetaOverride({
        coordKey: nextCoordKey,
        location: nextLocation,
      });

      const query = buildWeatherLocationQuery(nextLocation);
      router.replace(`${ROUTES.weather}?${query}`, { scroll: false });
    },
    [activeLocation.name, router, urlCoordKey],
  );

  const handleRefresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
    if (!previewsLoadedRef.current) {
      setPreviewRetryTick((prev) => prev + 1);
    }
  }, []);

  const currentResult = forecastState?.key === requestKey ? forecastState : null;
  const forecast =
    currentResult?.status === 'success'
      ? currentResult.data
      : forecastState?.status === 'success'
        ? forecastState.data
        : null;
  const isError = currentResult?.status === 'error';
  const isLoading = !isError && forecast === null;
  const isRefreshing = currentResult === null && forecast !== null;

  const todayDateKey = forecast?.daily[0]?.date ?? '';
  const selectedDate =
    selectedDateOverride &&
    selectedDateOverride.coordKey === urlCoordKey &&
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

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5EF]" lang="vi">
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          breadcrumbs={[
            { label: 'Trang chủ', href: ROUTES.home },
            { label: 'Dự báo thời tiết' },
          ]}
          title="Dự báo thời tiết"
          description="Theo dõi thời tiết hiện tại, diễn biến từng giờ và dự báo 5 ngày tới tại mọi địa điểm ở Việt Nam để chủ động lên kế hoạch du lịch."
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
                    ? `Cập nhật lúc ${formatLocalTime(forecast.fetchedAtUtc, forecast.timeZoneId)}`
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
          {/* Personalized Upcoming Tour Warnings & Trip Strip (Traveler only) */}
          <UpcomingTripWeatherSection
            trips={upcomingTrips}
            activeCoordKey={urlCoordKey}
            onSelectLocation={handleSelectLocation}
          />

          {/* Quick Suggestions + Vietnam Mapbox Search */}
          <div className="space-y-3">
            <WeatherLocationStrip
              locations={SUGGESTED_LOCATIONS}
              temperaturesById={temperaturesById}
              selectedLocationId={activeLocation.id ?? null}
              onSelectLocation={handleSelectLocation}
            />
            <WeatherLocationSearch onSelectLocation={handleSelectLocation} />
          </div>

          {isLoading ? (
            <WeatherPageSkeleton />
          ) : isError ? (
            <WeatherErrorState message={currentResult.message} onRetry={handleRefresh} />
          ) : forecast ? (
            <>
              {/* Hero + Detailed Metric Cards */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <CurrentWeatherHero
                    location={activeLocation}
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
                  setSelectedDateOverride({ coordKey: urlCoordKey, date })
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
                      Sẵn sàng lên lịch trình cho {activeLocation.name}?
                    </h3>
                    <p className="mt-0.5 text-xs text-[#5B6E69]">
                      Kết hợp dự báo thời tiết theo giờ với bộ lập lịch thông minh của TripMate để chọn điểm tham quan phù hợp.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
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
