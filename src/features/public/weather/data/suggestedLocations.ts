import type { WeatherLocation } from '../types/weatherForecast';

export const DEFAULT_TIME_ZONE_ID = 'Asia/Ho_Chi_Minh';

export const SUGGESTED_LOCATIONS: readonly WeatherLocation[] = [
  {
    id: 'danang',
    name: 'Đà Nẵng',
    region: 'Thành phố Đà Nẵng',
    subtitle: 'Trung tâm ven biển & Bãi biển Mỹ Khê',
    latitude: 16.0544,
    longitude: 108.2022,
    elevationM: 12,
    timeZoneId: DEFAULT_TIME_ZONE_ID,
  },
  {
    id: 'hoian',
    name: 'Hội An',
    region: 'Tỉnh Quảng Nam',
    subtitle: 'Phố cổ Hội An & Sông Hoài',
    latitude: 15.8801,
    longitude: 108.338,
    elevationM: 6,
    timeZoneId: DEFAULT_TIME_ZONE_ID,
  },
  {
    id: 'hue',
    name: 'Cố Đô Huế',
    region: 'Thành phố Huế',
    subtitle: 'Đại Nội, Sông Hương & Chùa Thiên Mụ',
    latitude: 16.4637,
    longitude: 107.5909,
    elevationM: 15,
    timeZoneId: DEFAULT_TIME_ZONE_ID,
  },
  {
    id: 'bana-hills',
    name: 'Bà Nà Hills',
    region: 'Hòa Vang, Đà Nẵng',
    subtitle: 'Đỉnh Núi Chúa & Cầu Vàng (1.487m)',
    latitude: 15.9977,
    longitude: 107.9881,
    elevationM: 1487,
    timeZoneId: DEFAULT_TIME_ZONE_ID,
  },
  {
    id: 'son-tra',
    name: 'Bán đảo Sơn Trà',
    region: 'Sơn Trà, Đà Nẵng',
    subtitle: 'Chùa Linh Ứng & Đỉnh Bàn Cờ',
    latitude: 16.12,
    longitude: 108.27,
    elevationM: 320,
    timeZoneId: DEFAULT_TIME_ZONE_ID,
  },
] as const;

export const DEFAULT_WEATHER_LOCATION: WeatherLocation = SUGGESTED_LOCATIONS[0];
