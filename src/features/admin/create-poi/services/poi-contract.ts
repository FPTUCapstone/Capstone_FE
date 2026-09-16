import type { CreatePoiRequest, PoiFormData, ValidationErrors } from '../types/poi';

const isBlank = (value: string | number) => String(value).trim() === '';
const isPositiveInt32 = (value: number) => Number.isInteger(value) && value > 0 && value <= 2147483647;
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
const timeOnly = (value: string) => value.length === 5 ? `${value}:00` : value;

export function createEmptyPoiForm(): PoiFormData {
  return { name: '', category_id: '', description: '', address: '', latitude: '', longitude: '', environment_setting: 'Outdoor', avg_visit_duration_minutes: '', has_shelter: false, tags: [], operating_schedule: [] };
}

export function validatePoiForm(data: PoiFormData): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!data.name.trim() || data.name.trim().length > 200) errors.name = 'Enter a name of 1–200 characters.';
  if (!isPositiveInt32(Number(data.category_id))) errors.category_id = 'Select a POI category.';
  if (data.address.trim().length > 400) errors.address = 'Address must be at most 400 characters.';
  if (data.description.trim().length > 2000) errors.description = 'Description must be at most 2,000 characters.';
  for (const [field, limit] of [['latitude', 90], ['longitude', 180]] as const) {
    if (isBlank(data[field]) || !Number.isFinite(Number(data[field])) || Math.abs(Number(data[field])) > limit) {
      errors[field] = `Enter a coordinate between -${limit} and ${limit}.`;
    }
  }
  if (!isBlank(data.avg_visit_duration_minutes) && !isPositiveInt32(Number(data.avg_visit_duration_minutes))) errors.avg_visit_duration_minutes = 'Enter a whole number from 1 to 2,147,483,647 minutes, or leave blank for 60 minutes.';
  if (!['Indoor', 'Outdoor', 'Mixed'].includes(data.environment_setting)) errors.environment_setting = 'Select Indoor, Outdoor or Mixed.';
  if (data.tags.some(id => !isPositiveInt32(id)) || new Set(data.tags).size !== data.tags.length) errors.tags = 'Select distinct tags from the catalogue.';
  if (new Set(data.operating_schedule.map(h => h.day_of_week)).size !== data.operating_schedule.length) errors.operating_schedule = 'Only one schedule entry is allowed per day.';
  for (const day of data.operating_schedule) {
    const key = `operating_schedule.${day.day_of_week}`;
    if (!Number.isInteger(day.day_of_week) || day.day_of_week < 0 || day.day_of_week > 6) errors[key] = 'Select a valid day of the week.';
    else if (day.is_open && (!validTime(day.open_time) || !validTime(day.close_time) || timeOnly(day.open_time) >= timeOnly(day.close_time))) errors[key] = `${day.day_name}: opening time must be earlier than closing time on the same day.`;
  }
  return errors;
}

// Form state can use UI names; only this flat DTO crosses the API boundary.
export function toCreatePoiRequest(data: PoiFormData, confirmDuplicate = false): CreatePoiRequest {
  if (Object.keys(validatePoiForm(data)).length) throw new Error('Invalid POI form');
  return {
    name: data.name.trim(), categoryId: Number(data.category_id),
    latitude: Number(data.latitude), longitude: Number(data.longitude),
    address: data.address.trim() || null, description: data.description.trim() || null,
    indoorOutdoor: data.environment_setting,
    averageVisitDurationMinutes: isBlank(data.avg_visit_duration_minutes) ? null : Number(data.avg_visit_duration_minutes),
    hasShelter: data.has_shelter, tagIds: [...data.tags],
    openingHours: data.operating_schedule.map(h => ({ dayOfWeek: h.day_of_week, openTime: h.is_open ? timeOnly(h.open_time) : null, closeTime: h.is_open ? timeOnly(h.close_time) : null, isClosed: !h.is_open })),
    confirmDuplicate,
  };
}

export function mapPoiErrors(errors: Record<string, string[]>, data: PoiFormData): ValidationErrors {
  const mapped: ValidationErrors = {};
  const names: Record<string, string> = { categoryId: 'category_id', indoorOutdoor: 'environment_setting', averageVisitDurationMinutes: 'avg_visit_duration_minutes', hasShelter: 'has_shelter', tagIds: 'tags', openingHours: 'operating_schedule' };
  for (const [rawKey, messages] of Object.entries(errors)) {
    const key = rawKey.replace(/^\$\./, '');
    const nested = /^openingHours\[(\d+)\]/.exec(key);
    const day = nested ? data.operating_schedule[Number(nested[1])]?.day_of_week : undefined;
    const target = day !== undefined ? `operating_schedule.${day}` : key.startsWith('tagIds[') ? 'tags' : names[key] ?? key;
    mapped[target] = [mapped[target], ...messages].filter(Boolean).join(' ');
  }
  return mapped;
}
