import type { PoiCategoryOption, PoiFormData } from '../types/poi';

export const POI_CATEGORIES: PoiCategoryOption[] = [
  { id: '1', name: 'Natural landmark' },
  { id: '2', name: 'Cultural & Historical' },
  { id: '3', name: 'Beach & Coastal' },
  { id: '4', name: 'Culinary & Food' },
  { id: '5', name: 'Entertainment & Leisure' },
  { id: '6', name: 'Shopping & Craft' },
];

export const INITIAL_OPERATING_SCHEDULE = [
  { day_of_week: 1, day_name: 'Monday', open_time: '07:00 AM', close_time: '05:30 PM', is_open: true },
  { day_of_week: 2, day_name: 'Tuesday', open_time: '07:00 AM', close_time: '05:30 PM', is_open: true },
  { day_of_week: 3, day_name: 'Wednesday', open_time: '07:00 AM', close_time: '05:30 PM', is_open: true },
  { day_of_week: 4, day_name: 'Thursday', open_time: '07:00 AM', close_time: '05:30 PM', is_open: true },
  { day_of_week: 5, day_name: 'Friday', open_time: '07:00 AM', close_time: '05:30 PM', is_open: true },
  { day_of_week: 6, day_name: 'Saturday', open_time: '07:00 AM', close_time: '05:30 PM', is_open: true },
  { day_of_week: 0, day_name: 'Sunday', open_time: '07:00 AM', close_time: '05:30 PM', is_open: true },
];

export const MARBLE_MOUNTAINS_PRESET: PoiFormData = {
  name: 'Marble Mountains',
  category_id: '1',
  description: 'Five limestone hills with caves, pagodas and panoramic viewpoints.',
  address: '81 Huyen Tran Cong Chua, Hoa Hai, Ngu Hanh Son, Da Nang',
  latitude: 16.003890,
  longitude: 108.264178,
  environment_setting: 'Mixed',
  avg_visit_duration_minutes: 90,
  has_shelter: true,
  tags: [1, 2, 3], // Prototype IDs only; never used by the live form.
  operating_schedule: [...INITIAL_OPERATING_SCHEDULE],
};

export const EMPTY_POI_FORM: PoiFormData = {
  name: '',
  category_id: '',
  description: '',
  address: '',
  latitude: '',
  longitude: '',
  environment_setting: 'Outdoor',
  avg_visit_duration_minutes: 60,
  has_shelter: false,
  tags: [],
  operating_schedule: INITIAL_OPERATING_SCHEDULE.map((h) => ({ ...h })),
};

export const DANANG_COORDINATE_PRESETS = [
  { name: 'Marble Mountains', address: '81 Huyen Tran Cong Chua, Hoa Hai, Ngu Hanh Son, Da Nang', lat: 16.003890, lng: 108.264178 },
  { name: 'Dragon Bridge', address: 'An Hai Tay, Son Tra, Da Nang', lat: 16.061099, lng: 108.227282 },
  { name: 'Ba Na Hills', address: 'Hoa Vang, Da Nang', lat: 15.996167, lng: 107.986861 },
  { name: 'Son Tra Peninsula', address: 'Tho Quang, Son Tra, Da Nang', lat: 16.100234, lng: 108.277812 },
  { name: 'My Khe Beach', address: 'Phuoc My, Son Tra, Da Nang', lat: 16.060124, lng: 108.246412 },
];
