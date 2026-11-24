import type { WeatherTipsDto } from '../types/schedulingTypes';

interface ItineraryWeatherTipsCardProps {
  tips: WeatherTipsDto;
}

/** `2026-11-25` -> `25/11`, by string so the day can never shift with the browser's time zone. */
function dayAndMonth(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

/**
 * UC-10: what to bring because of the weather that day. It only shows what the backend sent, in the order it sent it
 * (specs/UC-10-weather-packing-tips-web-spec.md).
 */
export function ItineraryWeatherTipsCard({ tips }: ItineraryWeatherTipsCardProps) {
  const { summary } = tips;

  return (
    <section
      role="region"
      aria-label="Gợi ý theo thời tiết"
      className="rounded-2xl border border-[#DCE2DD] bg-white p-4 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-[#103B39]" aria-hidden="true">
            partly_cloudy_day
          </span>
          <h2 className="text-sm font-bold text-[#1C2928]">{`Thời tiết ngày ${dayAndMonth(tips.date)}`}</h2>
        </div>
        <p className="text-xs font-semibold text-[#5B6E69]">
          {`${summary.minTempC}–${summary.maxTempC}°C · Mưa tối đa ${summary.maxRainProbabilityPercent}% · UV ${summary.maxUvIndex}`}
        </p>
      </div>

      {tips.tips.length === 0 ? (
        <p className="mt-3 text-sm text-[#5B6E69]">Thời tiết thuận lợi, không cần chuẩn bị đặc biệt.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tips.tips.map((tip) =>
            tip.severity === 'Warning' ? (
              <li
                key={tip.code}
                data-severity="Warning"
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  warning
                </span>
                <span>{tip.text}</span>
              </li>
            ) : (
              <li key={tip.code} className="flex items-start gap-2 px-1 text-sm text-[#1C2928]">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#5B6E69]" aria-hidden="true" />
                <span>{tip.text}</span>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}