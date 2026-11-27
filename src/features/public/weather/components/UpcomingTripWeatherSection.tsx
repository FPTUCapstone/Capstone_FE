'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { DEFAULT_TIME_ZONE_ID } from '../data/suggestedLocations';
import type {
  UpcomingTripWeatherDto,
  WeatherLocation,
} from '../types/weatherForecast';
import {
  describeWeatherCode,
  formatLocalTime,
  formatTemp,
  getLocalDateKey,
} from '../utils/weatherFormat';
import { weatherCoordinateKey } from '../utils/weatherLocation';

const WEEKDAY_SHORT_VI = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'] as const;

interface UpcomingTripWeatherSectionProps {
  trips: readonly UpcomingTripWeatherDto[];
  activeCoordKey: string;
  onSelectLocation: (location: WeatherLocation) => void;
}

function formatVietnamDateParts(isoUtc: string): { ddmm: string; weekdayShort: string } {
  if (!Number.isFinite(Date.parse(isoUtc))) {
    return { ddmm: '', weekdayShort: '' };
  }
  const dateKey = getLocalDateKey(isoUtc, DEFAULT_TIME_ZONE_ID);
  const [year, month, day] = dateKey.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) {
    return { ddmm: '', weekdayShort: '' };
  }
  const ddmm = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  const utcMidday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekdayShort = WEEKDAY_SHORT_VI[utcMidday.getUTCDay()] ?? '';
  return { ddmm, weekdayShort };
}

function formatWarningTimeRange(
  validFromUtc: string | null,
  validToUtc: string | null,
): string | null {
  const fromValid = validFromUtc !== null && Number.isFinite(Date.parse(validFromUtc));
  const toValid = validToUtc !== null && Number.isFinite(Date.parse(validToUtc));
  if (fromValid && toValid) {
    return `${formatLocalTime(validFromUtc, DEFAULT_TIME_ZONE_ID)}–${formatLocalTime(validToUtc, DEFAULT_TIME_ZONE_ID)}`;
  }
  if (fromValid) {
    return `Từ ${formatLocalTime(validFromUtc, DEFAULT_TIME_ZONE_ID)}`;
  }
  if (toValid) {
    return `Đến ${formatLocalTime(validToUtc, DEFAULT_TIME_ZONE_ID)}`;
  }
  return null;
}

function getReviewStatusSentence(reviewStatus: string): string | null {
  switch (reviewStatus) {
    case 'PendingAcknowledgement':
      return 'Nhà điều hành đang xem xét.';
    case 'Acknowledged':
      return 'Nhà điều hành đã xác nhận.';
    case 'Escalated':
      return 'Đội hỗ trợ TripMate đang xử lý.';
    default:
      return null;
  }
}

export function UpcomingTripWeatherSection({
  trips,
  activeCoordKey,
  onSelectLocation,
}: UpcomingTripWeatherSectionProps) {
  if (trips.length === 0) {
    return null;
  }

  const tripsWithWarnings = trips.filter((trip) => trip.warning !== null);

  return (
    <div className="space-y-4">
      {/* Urgent Tour Weather Warning Banners (UC-66) */}
      {tripsWithWarnings.length > 0 ? (
        <div className="space-y-2.5">
          {tripsWithWarnings.map((trip) => {
            const warning = trip.warning;
            if (!warning) return null;

            const { ddmm } = formatVietnamDateParts(trip.startAtUtc);
            const rawDescription = warning.description?.trim() || 'Cảnh báo thời tiết khẩn';
            const description = rawDescription.replace(/\.+$/, '');
            const statusSentence = getReviewStatusSentence(warning.reviewStatus);
            const timeRange = formatWarningTimeRange(warning.validFromUtc, warning.validToUtc);
            const instructions =
              warning.reviewStatus === 'Acknowledged' ? warning.operatorInstructions?.trim() : null;

            return (
              <div
                key={`warning-${trip.bookingId}`}
                role="status"
                aria-label={`Cảnh báo thời tiết ${trip.tourTitle}`}
                className="flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-[#DCE2DD] border-t-[3px] border-t-[#B96D4C] bg-white px-4 py-3.5 shadow-2xs sm:flex-row sm:items-center sm:px-5"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                    <span className="font-extrabold uppercase tracking-wider text-[#995436] tabular-nums">
                      Cảnh báo thời tiết tour
                      {ddmm ? ` · ${ddmm}` : ''}
                      {timeRange ? ` · ${timeRange}` : ''}
                    </span>
                    {statusSentence ? (
                      <span className="font-semibold text-[#5B6E69]">
                        · {statusSentence}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm leading-snug text-[#1C2928]">
                    <strong className="font-extrabold">{trip.tourTitle}</strong>
                    {ddmm ? ` (${ddmm})` : ''}: {description}.
                  </p>

                  {instructions ? (
                    <p className="text-xs leading-relaxed text-[#5B6E69]">
                      <strong className="font-semibold text-[#1C2928]">Lời dặn:</strong>{' '}
                      {instructions}
                    </p>
                  ) : null}
                </div>

                <Link
                  href={ROUTES.bookingTicket(trip.bookingId)}
                  className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-[#DCE2DD] bg-[#F7F5EF] px-4 py-2 text-xs font-bold text-[#103B39] transition hover:border-[#174B4A] hover:bg-[#E8F0EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A]"
                >
                  Xem booking →
                </Link>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Upcoming Trips Weather Strip */}
      <section aria-label="Chuyến đi sắp tới của bạn" className="space-y-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <h2 className="text-sm font-extrabold tracking-tight text-[#1C2928]">
            Chuyến đi sắp tới của bạn
          </h2>
          <p className="text-xs text-[#5B6E69]">
            Tour đã đặt · bấm để xem dự báo đúng địa điểm &amp; ngày
          </p>
        </div>

        <div
          className={`grid grid-cols-1 gap-3 ${
            trips.length === 2
              ? 'md:grid-cols-2'
              : trips.length >= 3
                ? 'md:grid-cols-2 lg:grid-cols-3'
                : ''
          }`}
        >
          {trips.map((trip) => {
            const { ddmm, weekdayShort } = formatVietnamDateParts(trip.startAtUtc);
            const hasWarning = trip.warning !== null;
            const point = trip.point;
            const forecast = trip.forecast;
            const visual = forecast
              ? describeWeatherCode(forecast.weatherCode, forecast.thunderstorm)
              : null;
            const isSelected =
              point !== null && weatherCoordinateKey(point) === activeCoordKey;

            const pointLabel = point
              ? point.name ?? `${point.latitude.toFixed(2)}°B, ${point.longitude.toFixed(2)}°Đ`
              : 'Chưa có vị trí để xem thời tiết';

            const dateLabel = trip.inProgress
              ? ddmm
                ? `Đang diễn ra · ${ddmm}`
                : 'Đang diễn ra'
              : weekdayShort && ddmm
                ? `${weekdayShort}, ${ddmm}`
                : ddmm;

            const cardBody = (
              <>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {visual ? (
                    <span
                      className={`material-symbols-outlined mt-0.5 shrink-0 text-[24px] ${visual.iconColorClass}`}
                      aria-hidden="true"
                    >
                      {visual.icon}
                    </span>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#1C2928]">
                      {trip.tourTitle}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-[#5B6E69] tabular-nums">
                      {trip.inProgress ? (
                        <span className="text-[#174B4A]">{dateLabel}</span>
                      ) : (
                        dateLabel
                      )}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-[#5B6E69]">{pointLabel}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 text-right">
                  {forecast ? (
                    <>
                      <span className="text-base font-black leading-tight text-[#1C2928] tabular-nums">
                        {formatTemp(forecast.minTempC)}–{formatTemp(forecast.maxTempC)}
                      </span>
                      <span className="text-[11px] font-bold text-sky-700 tabular-nums">
                        Mưa {Math.round(forecast.maxRainProbabilityPercent)}%
                      </span>
                    </>
                  ) : point ? (
                    <span className="max-w-[116px] text-[11px] font-semibold leading-snug text-[#5B6E69]">
                      Chưa tải được thời tiết
                    </span>
                  ) : null}

                  {hasWarning ? (
                    <span className="mt-1 inline-flex rounded-full bg-[#995436] px-2 py-0.5 text-[10px] font-bold text-white">
                      Cảnh báo
                    </span>
                  ) : null}
                </div>
              </>
            );

            const baseClasses = `flex w-full items-stretch justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
              hasWarning
                ? 'border-[#D97706]/70 bg-[#FFFBF5]'
                : 'border-[#DCE2DD] bg-white'
            } ${isSelected ? 'ring-2 ring-[#174B4A]/40' : ''}`;

            if (!point) {
              return (
                <article
                  key={trip.bookingId}
                  aria-label={trip.tourTitle}
                  className={`${baseClasses} opacity-90`}
                >
                  {cardBody}
                </article>
              );
            }

            return (
              <button
                key={trip.bookingId}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  onSelectLocation({
                    name: point.name ?? trip.tourTitle,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    timeZoneId: DEFAULT_TIME_ZONE_ID,
                  })
                }
                className={`${baseClasses} cursor-pointer shadow-2xs hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B4A] ${
                  hasWarning ? 'hover:border-[#995436]' : 'hover:border-[#174B4A]/60'
                }`}
              >
                {cardBody}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
