import type {
  HourlyForecastPointDto,
  WeatherConditionGroup,
} from '../types/weatherForecast';

export interface WeatherConditionVisual {
  labelVi: string;
  shortLabelVi: string;
  icon: string;
  group: WeatherConditionGroup;
  pillClass: string;
  iconColorClass: string;
}

/**
 * Maps Tomorrow.io `weatherCode` values to Vietnamese descriptions and Material Symbols icons.
 * Reference: Tomorrow.io Weather Codes (`v4/weather/forecast`).
 */
export function describeWeatherCode(
  weatherCode: number,
  thunderstorm = false,
  isNight = false,
): WeatherConditionVisual {
  if (thunderstorm || weatherCode === 8000) {
    return {
      labelVi: 'Có dông & mưa lớn',
      shortLabelVi: 'Có dông',
      icon: 'thunderstorm',
      group: 'storm',
      pillClass: 'border-rose-200 bg-rose-50 text-rose-800',
      iconColorClass: 'text-rose-500',
    };
  }

  switch (weatherCode) {
    case 1000:
      return {
        labelVi: isNight ? 'Trời quang về đêm' : 'Trời nắng quang đãng',
        shortLabelVi: isNight ? 'Trời quang' : 'Nắng đẹp',
        icon: isNight ? 'clear_night' : 'sunny',
        group: 'clear',
        pillClass: 'border-amber-200 bg-amber-50 text-amber-900',
        iconColorClass: isNight ? 'text-indigo-400' : 'text-amber-500',
      };
    case 1100:
      return {
        labelVi: isNight ? 'Ít mây về đêm' : 'Nắng nhẹ, ít mây',
        shortLabelVi: isNight ? 'Ít mây' : 'Nắng nhẹ',
        icon: isNight ? 'bedtime' : 'partly_cloudy_day',
        group: 'clear',
        pillClass: 'border-amber-200/80 bg-amber-50/80 text-amber-900',
        iconColorClass: isNight ? 'text-slate-400' : 'text-amber-500',
      };
    case 1101:
      return {
        labelVi: 'Có mây xen nắng',
        shortLabelVi: 'Có mây',
        icon: isNight ? 'partly_cloudy_night' : 'partly_cloudy_day',
        group: 'cloudy',
        pillClass: 'border-[#DCE2DD] bg-[#E8F0EA] text-[#174B4A]',
        iconColorClass: 'text-[#174B4A]',
      };
    case 1102:
    case 1001:
      return {
        labelVi: 'Nhiều mây âm u',
        shortLabelVi: 'Nhiều mây',
        icon: 'cloud',
        group: 'cloudy',
        pillClass: 'border-slate-200 bg-slate-100 text-slate-700',
        iconColorClass: 'text-slate-500',
      };
    case 2000:
    case 2100:
      return {
        labelVi: 'Có sương mù nhẹ',
        shortLabelVi: 'Sương mù',
        icon: 'foggy',
        group: 'fog',
        pillClass: 'border-slate-200 bg-slate-100 text-slate-700',
        iconColorClass: 'text-slate-500',
      };
    case 4000:
      return {
        labelVi: 'Mưa phùn rải rác',
        shortLabelVi: 'Mưa phùn',
        icon: 'grain',
        group: 'rain',
        pillClass: 'border-sky-200 bg-sky-50 text-sky-900',
        iconColorClass: 'text-sky-600',
      };
    case 4200:
      return {
        labelVi: 'Mưa rào nhẹ',
        shortLabelVi: 'Mưa nhẹ',
        icon: 'rainy_light',
        group: 'rain',
        pillClass: 'border-sky-200 bg-sky-50 text-sky-900',
        iconColorClass: 'text-sky-600',
      };
    case 4001:
      return {
        labelVi: 'Có mưa vừa',
        shortLabelVi: 'Mưa vừa',
        icon: 'rainy',
        group: 'rain',
        pillClass: 'border-sky-300 bg-sky-50 text-sky-900',
        iconColorClass: 'text-sky-600',
      };
    case 4201:
      return {
        labelVi: 'Mưa lớn kéo dài',
        shortLabelVi: 'Mưa to',
        icon: 'rainy_heavy',
        group: 'storm',
        pillClass: 'border-rose-200 bg-rose-50 text-rose-800',
        iconColorClass: 'text-rose-600',
      };
    default:
      return {
        labelVi: 'Thời tiết ổn định',
        shortLabelVi: 'Ổn định',
        icon: 'partly_cloudy_day',
        group: 'cloudy',
        pillClass: 'border-[#DCE2DD] bg-[#E8F0EA] text-[#174B4A]',
        iconColorClass: 'text-[#174B4A]',
      };
  }
}

export interface RainIntensityClassification {
  level: 'none' | 'light' | 'moderate' | 'heavy' | 'extreme' | 'storm';
  labelVi: string;
  guidanceVi: string;
  badgeClass: string;
}

/**
 * Rain thresholds aligned with Capstone_BE `WeatherAlertPolicy.cs` and `WeatherTipRules.cs`:
 * - `< 0.2 mm/h`: dry
 * - `0.2 .. < 2.5 mm/h`: light rain
 * - `2.5 .. < 10 mm/h`: moderate rain (UC-14 advisory threshold for Outdoor POIs)
 * - `10 .. < 50 mm/h`: heavy rain (UC-14 warning threshold for Outdoor POIs)
 * - `>= 50 mm/h` or thunderstorm: severe/extreme warning
 */
export function classifyRainIntensity(
  rainMmPerHour: number,
  thunderstorm = false,
): RainIntensityClassification {
  if (thunderstorm) {
    return {
      level: 'storm',
      labelVi: 'Dông sét',
      guidanceVi: 'Hạn chế di chuyển ngoài trời và khu vực thoáng rộng.',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-800',
    };
  }
  if (rainMmPerHour >= 50) {
    return {
      level: 'extreme',
      labelVi: 'Mưa cực lớn',
      guidanceVi: 'Nguy cơ ngập úng cao, nên tạm hoãn lộ trình di chuyển.',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-800',
    };
  }
  if (rainMmPerHour >= 10) {
    return {
      level: 'heavy',
      labelVi: 'Mưa to',
      guidanceVi: 'Không thuận lợi cho điểm ngoài trời, nên ưu tiên điểm có mái che.',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-800',
    };
  }
  if (rainMmPerHour >= 2.5) {
    return {
      level: 'moderate',
      labelVi: 'Mưa vừa',
      guidanceVi: 'Nên mang áo mưa/ô và cân nhắc khung giờ tham quan ngoài trời.',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
    };
  }
  if (rainMmPerHour >= 0.2) {
    return {
      level: 'light',
      labelVi: 'Mưa nhẹ',
      guidanceVi: 'Mưa nhỏ thoáng qua, mang theo ô gấp để chủ động.',
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-900',
    };
  }
  return {
    level: 'none',
    labelVi: 'Khô ráo',
    guidanceVi: 'Không có mưa đáng kể, thuận lợi cho hoạt động ngoài trời.',
    badgeClass: 'border-[#CBE0D4] bg-[#E8F0EA] text-[#103B39]',
  };
}

export interface UvClassification {
  level: 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
  labelVi: string;
  guidanceVi: string;
  badgeClass: string;
  barColorClass: string;
}

export function classifyUvIndex(uvIndex: number): UvClassification {
  const uv = Math.max(0, uvIndex);
  if (uv >= 11) {
    return {
      level: 'extreme',
      labelVi: 'Cực cao',
      guidanceVi: 'Tránh phơi nắng trực tiếp từ 11:00 đến 15:00.',
      badgeClass: 'border-purple-200 bg-purple-50 text-purple-900',
      barColorClass: 'bg-purple-600',
    };
  }
  if (uv >= 8) {
    return {
      level: 'very-high',
      labelVi: 'Rất cao',
      guidanceVi: 'Bôi kem chống nắng SPF 50+, kính râm và mũ rộng vành.',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-800',
      barColorClass: 'bg-rose-500',
    };
  }
  if (uv >= 6) {
    return {
      level: 'high',
      labelVi: 'Cao',
      guidanceVi: 'Nên dùng kem chống nắng và kính râm khi tham quan ngoài trời.',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
      barColorClass: 'bg-[#B96D4C]',
    };
  }
  if (uv >= 3) {
    return {
      level: 'moderate',
      labelVi: 'Trung bình',
      guidanceVi: 'Đội mũ nhẹ nếu đi bộ ngoài trời vào buổi trưa.',
      badgeClass: 'border-amber-200/80 bg-amber-50/70 text-amber-900',
      barColorClass: 'bg-amber-500',
    };
  }
  return {
    level: 'low',
    labelVi: 'Thấp',
    guidanceVi: 'An toàn cho các hoạt động tham quan ngoài trời.',
    badgeClass: 'border-[#CBE0D4] bg-[#E8F0EA] text-[#103B39]',
    barColorClass: 'bg-[#174B4A]',
  };
}

export interface WindClassification {
  kmPerHour: number;
  labelVi: string;
  guidanceVi: string;
  badgeClass: string;
}

/** Converts Tomorrow.io `windSpeedMps` (m/s) to km/h and Vietnamese Beaufort summary. */
export function classifyWindSpeed(windSpeedMps: number): WindClassification {
  const safeMps = Math.max(0, windSpeedMps);
  const kmPerHour = Math.round(safeMps * 3.6);

  if (safeMps >= 10) {
    return {
      kmPerHour,
      labelVi: 'Gió mạnh',
      guidanceVi: 'Chú ý an toàn khi ra bãi biển, đèo cao hoặc đi tàu thuyền.',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
    };
  }
  if (safeMps >= 5.5) {
    return {
      kmPerHour,
      labelVi: 'Gió vừa',
      guidanceVi: 'Thoáng mát ven biển, cảm giác mát hơn trên các đỉnh cao.',
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-900',
    };
  }
  return {
    kmPerHour,
    labelVi: 'Gió nhẹ',
    guidanceVi: 'Êm dịu, thuận lợi cho dạo bộ và tham quan ngoài trời.',
    badgeClass: 'border-[#CBE0D4] bg-[#E8F0EA] text-[#103B39]',
  };
}

export function formatDecimalVi(value: number, fractionDigits = 1): string {
  return value.toFixed(fractionDigits).replace('.', ',');
}

export function formatTemp(value: number): string {
  return `${Math.round(value)}°`;
}

export function getLocalHourNumber(isoUtc: string, timeZoneId = 'Asia/Ho_Chi_Minh'): number {
  const date = new Date(isoUtc);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZoneId,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '0';
  return Number.parseInt(hourPart, 10) % 24;
}

export function getLocalDateKey(isoUtc: string, timeZoneId = 'Asia/Ho_Chi_Minh'): string {
  const date = new Date(isoUtc);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

export function formatLocalTime(isoUtc: string, timeZoneId = 'Asia/Ho_Chi_Minh'): string {
  const date = new Date(isoUtc);
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: timeZoneId,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function formatLocalFullDate(isoUtc: string, timeZoneId = 'Asia/Ho_Chi_Minh'): string {
  const date = new Date(isoUtc);
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: timeZoneId,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

const WEEKDAY_SHORT_VI = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'] as const;

export function formatDailyLabel(
  dateKey: string,
  dayIndex: number,
): { primary: string; secondary: string } {
  const [year, month, day] = dateKey.split('-').map((n) => Number.parseInt(n, 10));
  const ddmm = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  if (dayIndex === 0) {
    return { primary: 'Hôm nay', secondary: ddmm };
  }
  if (dayIndex === 1) {
    return { primary: 'Ngày mai', secondary: ddmm };
  }
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = WEEKDAY_SHORT_VI[utcDate.getUTCDay()] ?? 'Thứ';
  return { primary: weekday, secondary: ddmm };
}

export function isNightHour(isoUtc: string, timeZoneId = 'Asia/Ho_Chi_Minh'): boolean {
  const hour = getLocalHourNumber(isoUtc, timeZoneId);
  return hour < 6 || hour >= 18;
}

/**
 * Finds the best daylight outdoor travel window (06:00 - 18:00) from hourly points.
 * Prioritizes dry, non-stormy hours with moderate heat/UV.
 */
export function findBestOutdoorWindow(
  hourly: readonly HourlyForecastPointDto[],
  timeZoneId = 'Asia/Ho_Chi_Minh',
): { rangeLabel: string; summaryVi: string } | null {
  const daylight = hourly.filter((h) => {
    const localHour = getLocalHourNumber(h.startUtc, timeZoneId);
    return localHour >= 6 && localHour <= 17;
  });

  if (daylight.length === 0) return null;

  const scored = daylight.map((h) => {
    let penalty = 0;
    if (h.thunderstorm) penalty += 100;
    penalty += h.rainMmPerHour * 14;
    penalty += h.rainProbabilityPercent * 0.35;
    if (h.apparentTemperatureC > 32) penalty += (h.apparentTemperatureC - 32) * 4;
    if (h.uvIndex >= 8) penalty += (h.uvIndex - 7) * 3;
    if (h.windSpeedMps >= 10) penalty += (h.windSpeedMps - 9) * 3;
    return { point: h, penalty };
  });

  // Evaluate 3-hour sliding window when available
  const windowSize = Math.min(3, scored.length);
  let bestStartIdx = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i <= scored.length - windowSize; i++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += scored[i + j].penalty;
    }
    if (sum < bestScore) {
      bestScore = sum;
      bestStartIdx = i;
    }
  }

  const startPoint = scored[bestStartIdx].point;
  const endPoint = scored[bestStartIdx + windowSize - 1].point;
  const endHourDate = new Date(new Date(endPoint.startUtc).getTime() + 60 * 60 * 1000);
  const rangeLabel = `${formatLocalTime(startPoint.startUtc, timeZoneId)} – ${formatLocalTime(endHourDate.toISOString(), timeZoneId)}`;

  const maxRain = Math.max(
    ...scored.slice(bestStartIdx, bestStartIdx + windowSize).map((s) => s.point.rainMmPerHour),
  );
  const avgTemp = Math.round(
    scored
      .slice(bestStartIdx, bestStartIdx + windowSize)
      .reduce((acc, s) => acc + s.point.temperatureC, 0) / windowSize,
  );

  if (maxRain >= 2.5) {
    return {
      rangeLabel,
      summaryVi: `Ít mưa nhất trong ngày (~${avgTemp}°C), vẫn nên chuẩn bị ô hoặc áo mưa.`,
    };
  }
  return {
    rangeLabel,
    summaryVi: `Mát mẻ khoảng ${avgTemp}°C, ít mưa — lý tưởng để tham quan ngoài trời.`,
  };
}
