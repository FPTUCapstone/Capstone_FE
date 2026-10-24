import { devTourSearchCopy } from '../resources/en';
import type { DevTourCategory, DevPagedToursResponseDto } from '../types/devTour';
import { parsePagedTours } from './tourApi';

export function isDevRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const integer = (value: unknown, minimum = 0): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
const utc = (value: unknown): value is string => typeof value === 'string' && /(?:Z|\+00:00)$/.test(value) && Number.isFinite(Date.parse(value));
const id = (value: unknown): value is string => typeof value === 'string' && /^[1-9]\d*$/.test(value);
const invalid = () => new Error(devTourSearchCopy.invalidResponse);

export function parseDevPagedTours(value: unknown): DevPagedToursResponseDto {
  if (
    !isDevRecord(value) || !integer(value.page, 1) ||
    !integer(value.pageSize, 1) || value.pageSize > 100 ||
    !integer(value.totalCount) || !integer(value.totalPages) ||
    value.totalPages !== Math.ceil(value.totalCount / value.pageSize) ||
    !utc(value.asOfUtc) || !Array.isArray(value.items) ||
    value.items.length > value.pageSize || value.items.length > value.totalCount
  ) throw invalid();
  const offset = (value.page - 1) * value.pageSize;
  if (!Number.isSafeInteger(offset) || value.items.length !== Math.min(value.pageSize, Math.max(0, value.totalCount - offset))) throw invalid();
  const parsed = parsePagedTours(value);
  const seen = new Set<string>();
  const ratings = value.items.map((item: unknown) => {
    if (
      !isDevRecord(item) || !id(item.tourId) || seen.has(item.tourId) ||
      !Array.isArray(item.destinations) || !item.destinations.every((destination: unknown) => typeof destination === 'string') ||
      !integer(item.durationDays, 1) || !integer(item.basePrice) || item.currency !== 'VND' ||
      !['available', 'soldOut', 'noUpcomingSchedule', 'unknown'].includes(String(item.availabilityStatus)) ||
      !(item.remainingSlots === null || integer(item.remainingSlots)) ||
      !(item.representativeScheduleId === null || id(item.representativeScheduleId)) ||
      !(item.departureAtUtc === null || utc(item.departureAtUtc)) ||
      !(item.thumbnailUrl === null || typeof item.thumbnailUrl === 'string') ||
      !(item.aggregateRating === null || (typeof item.aggregateRating === 'number' && Number.isFinite(item.aggregateRating) && item.aggregateRating >= 0 && item.aggregateRating <= 5))
    ) throw invalid();
    seen.add(item.tourId);
    return item.aggregateRating;
  });
  return { ...parsed, items: parsed.items.map((item, index) => ({ ...item, aggregateRating: ratings[index] })) };
}

export function parseDevTourCategories(value: unknown): DevTourCategory[] {
  if (!Array.isArray(value)) throw invalid();
  const seen = new Set<string>();
  return value.map((item: unknown) => {
    if (!isDevRecord(item) || !integer(item.categoryId, 1) || typeof item.code !== 'string' || !item.code.trim() || seen.has(item.code) || typeof item.name !== 'string' || !item.name.trim()) throw invalid();
    seen.add(item.code);
    return { categoryId: item.categoryId, code: item.code, name: item.name };
  });
}
