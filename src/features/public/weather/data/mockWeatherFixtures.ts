import type {
  CurrentWeatherDto,
  DailyForecastPointDto,
  HourlyForecastPointDto,
  WeatherForecastResponseDto,
  WeatherLocationDto,
  WeatherLocationPreview,
} from '../types/weatherForecast';
import { getLocalDateKey, getLocalHourNumber } from '../utils/weatherFormat';

export const DEFAULT_WEATHER_LOCATION_ID = 'danang';

export const CENTRAL_VIETNAM_LOCATIONS: readonly WeatherLocationDto[] = [
  {
    id: 'danang',
    name: 'Đà Nẵng',
    region: 'Thành phố Đà Nẵng',
    subtitle: 'Trung tâm ven biển & Bãi biển Mỹ Khê',
    latitude: 16.0544,
    longitude: 108.2022,
    elevationM: 12,
    timeZoneId: 'Asia/Ho_Chi_Minh',
  },
  {
    id: 'hoian',
    name: 'Hội An',
    region: 'Tỉnh Quảng Nam',
    subtitle: 'Phố cổ Hội An & Sông Hoài',
    latitude: 15.8801,
    longitude: 108.338,
    elevationM: 6,
    timeZoneId: 'Asia/Ho_Chi_Minh',
  },
  {
    id: 'hue',
    name: 'Cố Đô Huế',
    region: 'Thành phố Huế',
    subtitle: 'Đại Nội, Sông Hương & Chùa Thiên Mụ',
    latitude: 16.4637,
    longitude: 107.5909,
    elevationM: 15,
    timeZoneId: 'Asia/Ho_Chi_Minh',
  },
  {
    id: 'bana-hills',
    name: 'Bà Nà Hills',
    region: 'Hòa Vang, Đà Nẵng',
    subtitle: 'Đỉnh Núi Chúa & Cầu Vàng (1.487m)',
    latitude: 15.9977,
    longitude: 107.9881,
    elevationM: 1487,
    timeZoneId: 'Asia/Ho_Chi_Minh',
  },
  {
    id: 'son-tra',
    name: 'Bán đảo Sơn Trà',
    region: 'Sơn Trà, Đà Nẵng',
    subtitle: 'Chùa Linh Ứng & Đỉnh Bàn Cờ',
    latitude: 16.12,
    longitude: 108.27,
    elevationM: 320,
    timeZoneId: 'Asia/Ho_Chi_Minh',
  },
] as const;

interface LocationWeatherProfile {
  baseTempC: number;
  diurnalSwingC: number;
  apparentOffsetC: number;
  baseHumidity: number;
  baseWindMps: number;
  peakUv: number;
  sunrise: string;
  sunset: string;
  /** Hourly rain mm/h curve across 0..23 local hour for Day 0 (Today) */
  todayRainCurve: (localHour: number) => {
    rainMm: number;
    prob: number;
    thunderstorm?: boolean;
    fog?: boolean;
    cloudCover?: number;
  };
  /** 5-day profile variations relative to baseTempC */
  dayProfiles: ReadonlyArray<{
    minDeltaC: number;
    maxDeltaC: number;
    maxRainProb: number;
    maxRainMm: number;
    totalRainMm: number;
    maxUv: number;
    maxWindMps: number;
    thunderstorm: boolean;
    weatherCode: number;
    humidityAvg: number;
  }>;
}

const LOCATION_PROFILES: Record<string, LocationWeatherProfile> = {
  danang: {
    baseTempC: 26.5,
    diurnalSwingC: 4.5,
    apparentOffsetC: 2.2,
    baseHumidity: 74,
    baseWindMps: 4.6,
    peakUv: 8,
    sunrise: '05:56',
    sunset: '17:18',
    todayRainCurve: (h) => {
      if (h >= 16 && h <= 18) return { rainMm: 0.4, prob: 35, cloudCover: 68 };
      if (h >= 11 && h <= 15) return { rainMm: 0, prob: 12, cloudCover: 28 };
      return { rainMm: 0, prob: 15, cloudCover: 38 };
    },
    dayProfiles: [
      { minDeltaC: -3, maxDeltaC: 4.5, maxRainProb: 35, maxRainMm: 0.4, totalRainMm: 1.2, maxUv: 8, maxWindMps: 6.2, thunderstorm: false, weatherCode: 1101, humidityAvg: 74 },
      { minDeltaC: -3.5, maxDeltaC: 3.5, maxRainProb: 60, maxRainMm: 2.8, totalRainMm: 8.4, maxUv: 6, maxWindMps: 7.4, thunderstorm: false, weatherCode: 4001, humidityAvg: 81 },
      { minDeltaC: -2.5, maxDeltaC: 5.0, maxRainProb: 20, maxRainMm: 0, totalRainMm: 0, maxUv: 9, maxWindMps: 5.1, thunderstorm: false, weatherCode: 1000, humidityAvg: 69 },
      { minDeltaC: -2.5, maxDeltaC: 4.5, maxRainProb: 25, maxRainMm: 0.2, totalRainMm: 0.5, maxUv: 8, maxWindMps: 5.4, thunderstorm: false, weatherCode: 1100, humidityAvg: 72 },
      { minDeltaC: -3.0, maxDeltaC: 3.0, maxRainProb: 75, maxRainMm: 6.5, totalRainMm: 18.2, maxUv: 5, maxWindMps: 8.8, thunderstorm: true, weatherCode: 8000, humidityAvg: 85 },
    ],
  },
  hoian: {
    baseTempC: 26.0,
    diurnalSwingC: 4.2,
    apparentOffsetC: 2.5,
    baseHumidity: 78,
    baseWindMps: 3.8,
    peakUv: 7,
    sunrise: '05:55',
    sunset: '17:17',
    todayRainCurve: (h) => {
      if (h >= 14 && h <= 17) return { rainMm: 1.6, prob: 58, cloudCover: 78 };
      if (h === 18) return { rainMm: 0.5, prob: 40, cloudCover: 64 };
      return { rainMm: 0, prob: 18, cloudCover: 42 };
    },
    dayProfiles: [
      { minDeltaC: -3.0, maxDeltaC: 4.0, maxRainProb: 58, maxRainMm: 1.6, totalRainMm: 5.2, maxUv: 7, maxWindMps: 5.3, thunderstorm: false, weatherCode: 4200, humidityAvg: 78 },
      { minDeltaC: -3.2, maxDeltaC: 3.2, maxRainProb: 68, maxRainMm: 3.4, totalRainMm: 11.6, maxUv: 6, maxWindMps: 6.1, thunderstorm: false, weatherCode: 4001, humidityAvg: 83 },
      { minDeltaC: -2.5, maxDeltaC: 4.5, maxRainProb: 25, maxRainMm: 0, totalRainMm: 0, maxUv: 8, maxWindMps: 4.5, thunderstorm: false, weatherCode: 1100, humidityAvg: 73 },
      { minDeltaC: -2.0, maxDeltaC: 4.8, maxRainProb: 15, maxRainMm: 0, totalRainMm: 0, maxUv: 8, maxWindMps: 4.2, thunderstorm: false, weatherCode: 1000, humidityAvg: 70 },
      { minDeltaC: -3.0, maxDeltaC: 3.0, maxRainProb: 65, maxRainMm: 4.2, totalRainMm: 14.0, maxUv: 5, maxWindMps: 6.9, thunderstorm: false, weatherCode: 4001, humidityAvg: 84 },
    ],
  },
  hue: {
    baseTempC: 23.5,
    diurnalSwingC: 3.2,
    apparentOffsetC: 1.6,
    baseHumidity: 87,
    baseWindMps: 4.2,
    peakUv: 5,
    sunrise: '05:59',
    sunset: '17:19',
    todayRainCurve: (h) => {
      if (h >= 12 && h <= 16) return { rainMm: 4.8, prob: 85, cloudCover: 94 };
      if (h >= 9 && h <= 11) return { rainMm: 2.6, prob: 72, cloudCover: 88 };
      if (h >= 17 && h <= 20) return { rainMm: 1.8, prob: 65, cloudCover: 85 };
      return { rainMm: 0.6, prob: 48, cloudCover: 78 };
    },
    dayProfiles: [
      { minDeltaC: -2.5, maxDeltaC: 3.0, maxRainProb: 85, maxRainMm: 4.8, totalRainMm: 26.4, maxUv: 5, maxWindMps: 6.4, thunderstorm: false, weatherCode: 4001, humidityAvg: 87 },
      { minDeltaC: -3.0, maxDeltaC: 2.5, maxRainProb: 90, maxRainMm: 11.4, totalRainMm: 42.8, maxUv: 4, maxWindMps: 9.2, thunderstorm: true, weatherCode: 8000, humidityAvg: 91 },
      { minDeltaC: -2.5, maxDeltaC: 3.2, maxRainProb: 62, maxRainMm: 2.2, totalRainMm: 9.5, maxUv: 6, maxWindMps: 5.8, thunderstorm: false, weatherCode: 4200, humidityAvg: 82 },
      { minDeltaC: -2.0, maxDeltaC: 4.2, maxRainProb: 35, maxRainMm: 0.4, totalRainMm: 1.2, maxUv: 7, maxWindMps: 4.6, thunderstorm: false, weatherCode: 1101, humidityAvg: 76 },
      { minDeltaC: -2.2, maxDeltaC: 4.0, maxRainProb: 45, maxRainMm: 1.1, totalRainMm: 3.8, maxUv: 6, maxWindMps: 5.1, thunderstorm: false, weatherCode: 4000, humidityAvg: 79 },
    ],
  },
  'bana-hills': {
    baseTempC: 18.2,
    diurnalSwingC: 3.6,
    apparentOffsetC: -1.1,
    baseHumidity: 86,
    baseWindMps: 9.4,
    peakUv: 6,
    sunrise: '05:57',
    sunset: '17:19',
    todayRainCurve: (h) => {
      if (h <= 8 || h >= 19) return { rainMm: 0.3, prob: 45, fog: true, cloudCover: 90 };
      if (h >= 15 && h <= 17) return { rainMm: 1.2, prob: 55, cloudCover: 82 };
      return { rainMm: 0, prob: 25, cloudCover: 56 };
    },
    dayProfiles: [
      { minDeltaC: -3.2, maxDeltaC: 3.6, maxRainProb: 55, maxRainMm: 1.2, totalRainMm: 4.1, maxUv: 6, maxWindMps: 11.4, thunderstorm: false, weatherCode: 2000, humidityAvg: 86 },
      { minDeltaC: -3.5, maxDeltaC: 3.0, maxRainProb: 70, maxRainMm: 3.8, totalRainMm: 13.5, maxUv: 5, maxWindMps: 12.1, thunderstorm: false, weatherCode: 4001, humidityAvg: 90 },
      { minDeltaC: -2.8, maxDeltaC: 4.2, maxRainProb: 30, maxRainMm: 0.2, totalRainMm: 0.6, maxUv: 7, maxWindMps: 8.6, thunderstorm: false, weatherCode: 1101, humidityAvg: 79 },
      { minDeltaC: -2.5, maxDeltaC: 4.5, maxRainProb: 22, maxRainMm: 0, totalRainMm: 0, maxUv: 8, maxWindMps: 7.9, thunderstorm: false, weatherCode: 1100, humidityAvg: 75 },
      { minDeltaC: -3.4, maxDeltaC: 2.8, maxRainProb: 80, maxRainMm: 7.2, totalRainMm: 22.0, maxUv: 4, maxWindMps: 13.0, thunderstorm: true, weatherCode: 8000, humidityAvg: 92 },
    ],
  },
  'son-tra': {
    baseTempC: 25.0,
    diurnalSwingC: 4.0,
    apparentOffsetC: 1.8,
    baseHumidity: 76,
    baseWindMps: 6.8,
    peakUv: 9,
    sunrise: '05:55',
    sunset: '17:17',
    todayRainCurve: (h) => {
      if (h >= 16 && h <= 17) return { rainMm: 0.6, prob: 38, cloudCover: 62 };
      return { rainMm: 0, prob: 14, cloudCover: 30 };
    },
    dayProfiles: [
      { minDeltaC: -3.0, maxDeltaC: 4.0, maxRainProb: 38, maxRainMm: 0.6, totalRainMm: 1.4, maxUv: 9, maxWindMps: 10.6, thunderstorm: false, weatherCode: 1100, humidityAvg: 76 },
      { minDeltaC: -3.2, maxDeltaC: 3.2, maxRainProb: 78, maxRainMm: 8.5, totalRainMm: 21.6, maxUv: 6, maxWindMps: 11.8, thunderstorm: true, weatherCode: 8000, humidityAvg: 84 },
      { minDeltaC: -2.6, maxDeltaC: 4.6, maxRainProb: 18, maxRainMm: 0, totalRainMm: 0, maxUv: 9, maxWindMps: 7.2, thunderstorm: false, weatherCode: 1000, humidityAvg: 71 },
      { minDeltaC: -2.4, maxDeltaC: 4.4, maxRainProb: 20, maxRainMm: 0, totalRainMm: 0, maxUv: 8, maxWindMps: 6.8, thunderstorm: false, weatherCode: 1101, humidityAvg: 73 },
      { minDeltaC: -3.0, maxDeltaC: 3.1, maxRainProb: 65, maxRainMm: 3.9, totalRainMm: 12.2, maxUv: 5, maxWindMps: 9.8, thunderstorm: false, weatherCode: 4001, humidityAvg: 83 },
    ],
  },
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function inferWeatherCode(
  rainMm: number,
  cloudCover: number,
  thunderstorm: boolean,
  fog = false,
): number {
  if (thunderstorm) return 8000;
  if (rainMm >= 10) return 4201;
  if (rainMm >= 2.5) return 4001;
  if (rainMm >= 0.6) return 4200;
  if (rainMm >= 0.2) return 4000;
  if (fog) return 2000;
  if (cloudCover >= 80) return 1001;
  if (cloudCover >= 50) return 1101;
  if (cloudCover >= 25) return 1100;
  return 1000;
}

function addDaysToDateKey(dateKey: string, daysToAdd: number): string {
  const [year, month, day] = dateKey.split('-').map((n) => Number.parseInt(n, 10));
  const next = new Date(Date.UTC(year, month - 1, day + daysToAdd, 12, 0, 0));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, '0');
  const d = String(next.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfUtcHour(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      0,
      0,
      0,
    ),
  );
}

export function resolveWeatherLocation(locationId?: string | null): WeatherLocationDto {
  const normalized = (locationId ?? '').trim().toLowerCase();
  return (
    CENTRAL_VIETNAM_LOCATIONS.find((loc) => loc.id === normalized) ??
    CENTRAL_VIETNAM_LOCATIONS[0]
  );
}

/**
 * Generates deterministic Tomorrow.io-shaped hourly (48h) and 5-day forecast mock data
 * anchored to `now` in `Asia/Ho_Chi_Minh`.
 */
export function buildMockWeatherForecast(
  locationId?: string | null,
  now: Date = new Date(),
): WeatherForecastResponseDto {
  const location = resolveWeatherLocation(locationId);
  const profile = LOCATION_PROFILES[location.id] ?? LOCATION_PROFILES[DEFAULT_WEATHER_LOCATION_ID];
  const anchorHour = startOfUtcHour(now);
  const todayKey = getLocalDateKey(anchorHour.toISOString(), location.timeZoneId);

  const hourly: HourlyForecastPointDto[] = [];
  for (let offset = 0; offset < 48; offset++) {
    const slotDate = new Date(anchorHour.getTime() + offset * 60 * 60 * 1000);
    const slotIso = slotDate.toISOString();
    const localHour = getLocalHourNumber(slotIso, location.timeZoneId);
    const slotDayKey = getLocalDateKey(slotIso, location.timeZoneId);
    const isNextDay = slotDayKey !== todayKey;

    // Smooth diurnal sine wave peaking at 14:00 local time and dipping at 04:00
    const diurnalFactor = Math.sin(((localHour - 8) / 24) * 2 * Math.PI);
    const dayShift = isNextDay ? -0.8 : 0;
    const temperatureC = round1(
      profile.baseTempC + diurnalFactor * profile.diurnalSwingC + dayShift,
    );
    const apparentTemperatureC = round1(
      temperatureC + profile.apparentOffsetC + (localHour >= 11 && localHour <= 15 ? 0.6 : -0.2),
    );

    const baseRain = profile.todayRainCurve(localHour);
    const nextDayProfile = profile.dayProfiles[1];
    let rainMmPerHour = baseRain.rainMm;
    let rainProbabilityPercent = baseRain.prob;
    let thunderstorm = Boolean(baseRain.thunderstorm);
    let cloudCoverPercent = baseRain.cloudCover ?? 42;

    if (isNextDay) {
      if (localHour >= 13 && localHour <= 17) {
        rainMmPerHour = round1(
          nextDayProfile.maxRainMm * (localHour === 15 ? 1 : 0.68),
        );
        rainProbabilityPercent = nextDayProfile.maxRainProb;
        thunderstorm = nextDayProfile.thunderstorm && localHour === 15;
        cloudCoverPercent = clamp(Math.round(55 + nextDayProfile.maxRainProb * 0.42), 30, 98);
      } else if (localHour >= 9 && localHour <= 12) {
        rainMmPerHour = round1(nextDayProfile.maxRainMm * 0.25);
        rainProbabilityPercent = Math.round(nextDayProfile.maxRainProb * 0.65);
        cloudCoverPercent = clamp(Math.round(45 + nextDayProfile.maxRainProb * 0.35), 25, 92);
      } else {
        rainMmPerHour = round1(nextDayProfile.maxRainMm * 0.1);
        rainProbabilityPercent = Math.round(nextDayProfile.maxRainProb * 0.45);
        cloudCoverPercent = 64;
      }
    }

    // UV bell curve between 06:00 and 18:00, attenuated by cloud cover / rain
    let uvIndex = 0;
    if (localHour >= 6 && localHour <= 17) {
      const solarFactor = Math.sin(((localHour - 6) / 12) * Math.PI);
      const cloudAttenuation = 1 - (cloudCoverPercent / 100) * 0.45;
      const dayUvCap = isNextDay ? nextDayProfile.maxUv : profile.peakUv;
      uvIndex = Math.round(clamp(solarFactor * dayUvCap * cloudAttenuation * 1.15, 0, dayUvCap));
    }

    // Afternoon sea/mountain breeze pickup
    const breezeFactor = localHour >= 12 && localHour <= 18 ? 1.22 : localHour <= 5 ? 0.8 : 0.98;
    const windSpeedMps = round1(
      clamp(profile.baseWindMps * breezeFactor + (thunderstorm ? 2.4 : 0), 1.2, 16),
    );

    const humidityPercent = Math.round(
      clamp(
        profile.baseHumidity - diurnalFactor * 8 + (rainMmPerHour > 0 ? 9 : 0),
        48,
        98,
      ),
    );

    const visibilityKm = round1(
      thunderstorm
        ? 4.2
        : rainMmPerHour >= 4
          ? 5.8
          : baseRain.fog
            ? 3.5
            : rainMmPerHour >= 0.5
              ? 8.5
              : 14.5,
    );

    const weatherCode = inferWeatherCode(
      rainMmPerHour,
      cloudCoverPercent,
      thunderstorm,
      Boolean(baseRain.fog),
    );

    hourly.push({
      startUtc: slotIso,
      temperatureC,
      apparentTemperatureC,
      rainProbabilityPercent: Math.round(clamp(rainProbabilityPercent, 0, 100)),
      rainMmPerHour: round1(Math.max(0, rainMmPerHour)),
      uvIndex,
      windSpeedMps,
      thunderstorm,
      weatherCode,
      humidityPercent,
      cloudCoverPercent: Math.round(clamp(cloudCoverPercent, 0, 100)),
      visibilityKm,
    });
  }

  const daily: DailyForecastPointDto[] = profile.dayProfiles.map((day, index) => {
    const date = addDaysToDateKey(todayKey, index);
    const matchingHours = hourly.filter(
      (h) => getLocalDateKey(h.startUtc, location.timeZoneId) === date,
    );

    // Keep Day 0 aligned with actual generated hourly bounds where available
    const baseMin = Math.round(profile.baseTempC + day.minDeltaC);
    const baseMax = Math.round(profile.baseTempC + day.maxDeltaC);
    const minTempC =
      index === 0 && matchingHours.length > 0
        ? Math.min(baseMin, Math.round(Math.min(...matchingHours.map((h) => h.temperatureC))))
        : baseMin;
    const maxTempC =
      index === 0 && matchingHours.length > 0
        ? Math.max(baseMax, Math.round(Math.max(...matchingHours.map((h) => h.temperatureC))))
        : baseMax;

    return {
      date,
      minTempC,
      maxTempC,
      maxApparentTempC: Math.round(maxTempC + Math.max(0, profile.apparentOffsetC)),
      maxRainProbabilityPercent: day.maxRainProb,
      maxRainMmPerHour: day.maxRainMm,
      totalRainMm: day.totalRainMm,
      maxUvIndex: day.maxUv,
      maxWindSpeedMps: day.maxWindMps,
      thunderstorm: day.thunderstorm,
      weatherCode: day.weatherCode,
      humidityAvgPercent: day.humidityAvg,
      sunriseTime: profile.sunrise,
      sunsetTime: profile.sunset,
    };
  });

  const firstHour = hourly[0];
  const current: CurrentWeatherDto = {
    observedAtUtc: now.toISOString(),
    temperatureC: firstHour.temperatureC,
    apparentTemperatureC: firstHour.apparentTemperatureC,
    rainProbabilityPercent: firstHour.rainProbabilityPercent,
    rainMmPerHour: firstHour.rainMmPerHour,
    uvIndex: firstHour.uvIndex,
    windSpeedMps: firstHour.windSpeedMps,
    thunderstorm: firstHour.thunderstorm,
    weatherCode: firstHour.weatherCode,
    humidityPercent: firstHour.humidityPercent,
    visibilityKm: firstHour.visibilityKm,
    cloudCoverPercent: firstHour.cloudCoverPercent,
  };

  return {
    source: 'mock',
    provider: 'Tomorrow.io',
    location,
    timeZoneId: location.timeZoneId,
    fetchedAtUtc: now.toISOString(),
    current,
    hourly,
    daily,
  };
}

export function getMockLocationPreviews(now: Date = new Date()): WeatherLocationPreview[] {
  return CENTRAL_VIETNAM_LOCATIONS.map((location) => {
    const forecast = buildMockWeatherForecast(location.id, now);
    return {
      location,
      temperatureC: forecast.current.temperatureC,
      rainProbabilityPercent: forecast.current.rainProbabilityPercent,
      rainMmPerHour: forecast.current.rainMmPerHour,
      weatherCode: forecast.current.weatherCode,
      thunderstorm: forecast.current.thunderstorm,
    };
  });
}
