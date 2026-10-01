/**
 * TripMate UC-10 — Create Scheduling Request Types & Data Contracts
 * Strictly aligned with Capstone_BE SchedulingRequestsController & Domain Enums
 */

import { PreferredTransportId, TravelPaceId } from '@/features/account/preferences/travelPreferencesTypes';

export type TransportMode = 'Walking' | 'Motorbike' | 'Car' | 'PublicTransit';


export type RestPreference = 'Auto' | 'None' | 'Frequent';

export type ItineraryItemKind = 'Visit' | 'Rest';

export interface DestinationPreset {
  id: string;
  name: string;
  province: string;
  description: string;
  centerLatitude: number;
  centerLongitude: number;
  defaultStartLatitude: number;
  defaultStartLongitude: number;
  defaultStartAddress: string;
  badge?: string;
}

export const DESTINATION_PRESETS: DestinationPreset[] = [
  {
    id: 'danang',
    name: 'Đà Nẵng',
    province: 'Thành phố Đà Nẵng',
    description: 'Thành phố biển hiện đại, cầu Rồng, bán đảo Sơn Trà & Ngũ Hành Sơn',
    centerLatitude: 16.0471,
    centerLongitude: 108.2068,
    defaultStartLatitude: 16.0544,
    defaultStartLongitude: 108.2022,
    defaultStartAddress: 'Trung tâm Hải Châu / Cầu Rồng, Đà Nẵng',
    badge: 'Hỗ trợ tối ưu AI',
  },
  {
    id: 'hoian',
    name: 'Hội An',
    province: 'Tỉnh Quảng Nam',
    description: 'Đô thị cổ di sản UNESCO, sông Hoài, đèn lồng và ẩm thực dân dã',
    centerLatitude: 15.8801,
    centerLongitude: 108.338,
    defaultStartLatitude: 15.8801,
    defaultStartLongitude: 108.338,
    defaultStartAddress: 'Khu phố cổ Hội An / Chùa Cầu',
    badge: 'Di sản',
  },
  {
    id: 'hue',
    name: 'Huế',
    province: 'Tỉnh Thừa Thiên Huế',
    description: 'Cố đô thanh bình, Đại Nội, chùa Thiên Mụ và ẩm thực cung đình',
    centerLatitude: 16.4637,
    centerLongitude: 107.5909,
    defaultStartLatitude: 16.4637,
    defaultStartLongitude: 107.5909,
    defaultStartAddress: 'Quảng trường Ngọ Môn / Đại Nội Huế',
  },
  {
    id: 'hanoi',
    name: 'Hà Nội',
    province: 'Thủ đô Hà Nội',
    description: '36 phố phường, Hồ Gươm cổ kính và văn hóa ẩm thực nghìn năm',
    centerLatitude: 21.0285,
    centerLongitude: 105.8542,
    defaultStartLatitude: 21.0285,
    defaultStartLongitude: 105.8542,
    defaultStartAddress: 'Hồ Hoàn Kiếm / Phố Cổ Hà Nội',
  },
  {
    id: 'hcmc',
    name: 'TP. Hồ Chí Minh',
    province: 'Thành phố Hồ Chí Minh',
    description: 'Trung tâm đô thị sầm uất, ẩm thực đa dạng và nhịp sống năng động',
    centerLatitude: 10.8231,
    centerLongitude: 106.6297,
    defaultStartLatitude: 10.7769,
    defaultStartLongitude: 106.7009,
    defaultStartAddress: 'Chợ Bến Thành / Nhà thờ Đức Bà, Quận 1',
  },
];

export interface CreateSchedulingRequestPayload {
  startAt: string; // ISO 8601 format e.g. 2026-10-20T08:00:00+07:00
  timeZoneId: string; // Asia/Ho_Chi_Minh
  startLatitude: number;
  startLongitude: number;
  explorationLatitude: number;
  explorationLongitude: number;
  endPoiId: number | null;
  returnToStart: boolean;
  availableMinutes: number; // 60 to 720
  transportMode: TransportMode;
  searchRadiusKm: number; // 1 to 50
  budgetVnd: number | null;
  mandatoryPoiIds?: number[];
  restPreference: RestPreference;
}

export interface SchedulingItemDto {
  sequenceNo: number;
  poiId: number | null;
  poiName: string | null;
  itemKind: ItineraryItemKind;
  plannedArrival: string;
  plannedDeparture: string;
  stayDurationMinutes: number;
  travelDurationToNextMinutes: number | null;
  estimatedCost: number | null;
  isMandatory: boolean;
  recommendationReason: string | null;
}

export interface SchedulingResponseDto {
  schedulingRequestId: number;
  itineraryId: number;
  title: string;
  status: string;
  totalEstimatedCost: number;
  totalDurationMinutes: number;
  items: SchedulingItemDto[];
}

export interface SchedulingFormValues {
  destinationId: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  availableHours: number; // 1 to 12
  searchRadiusKm: number; // 1 to 50
  returnToStart: boolean;
  transportMode: TransportMode;
  restPreference: RestPreference;
  budgetVnd: number | '';
}

export function mapTransportPreferenceToMode(pref: PreferredTransportId): TransportMode {
  switch (pref) {
    case 'walking':
      return 'Walking';
    case 'motorbike':
      return 'Motorbike';
    case 'car':
      return 'Car';
    case 'publicTransit':
      return 'PublicTransit';
    default:
      return 'Motorbike';
  }
}

export function mapPaceToRestPreference(pace: TravelPaceId): RestPreference {
  switch (pace) {
    case 'relaxed':
      return 'Frequent';
    case 'packed':
      return 'None';
    case 'balanced':
    default:
      return 'Auto';
  }
}

export const TRIPMATE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function getVietnamCalendarDate(now?: Date): string {
  const d = now ?? new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TRIPMATE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function getVietnamTomorrowDateString(now?: Date): string {
  const today = getVietnamCalendarDate(now);
  const [y, m, d] = today.split('-').map(Number);
  const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
  const nextY = nextDate.getUTCFullYear();
  const nextM = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
  const nextD = String(nextDate.getUTCDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

export function buildVietnamStartAtIso(date: string, time: string): string {
  return `${date}T${time}:00+07:00`;
}

export function isFutureVietnamStartAt(date: string, time: string, now?: Date): boolean {
  if (!date || !time) return false;
  const startInstant = new Date(buildVietnamStartAtIso(date, time)).getTime();
  const currentInstant = (now ?? new Date()).getTime();
  return !isNaN(startInstant) && startInstant > currentInstant;
}

export function getTodayDateString(now?: Date): string {
  return getVietnamCalendarDate(now);
}

export function getTomorrowDateString(now?: Date): string {
  return getVietnamTomorrowDateString(now);
}
