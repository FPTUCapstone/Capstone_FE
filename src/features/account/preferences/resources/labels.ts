import type { FoodPreference, PreferredTransportMode, RiskTolerance, TravelPace } from '../travelPreferencesTypes';

/**
 * Vietnamese display labels for UC-09 option keys (D-W2). Labels are presentation only and
 * are never sent to the backend; unknown keys fall back to the key itself.
 */
export const transportLabels: Record<PreferredTransportMode, string> = {
  Walking: 'Đi bộ',
  Motorbike: 'Xe máy',
  Car: 'Ô tô / Taxi',
  PublicTransit: 'Xe buýt / Công cộng',
};

export const paceLabels: Record<TravelPace, string> = {
  Relaxed: 'Thư thái',
  Moderate: 'Cân bằng',
  Fast: 'Nhanh',
};

export const riskLabels: Record<RiskTolerance, string> = {
  Low: 'Thấp — ưu tiên an toàn',
  Medium: 'Trung bình',
  High: 'Cao — sẵn sàng phiêu lưu',
};

export const foodLabels: Record<FoodPreference, string> = {
  NoRestriction: 'Không kiêng',
  Vegetarian: 'Ăn chay',
  Vegan: 'Thuần chay',
  Halal: 'Halal',
  NoSeafood: 'Không hải sản',
};

/** Known catalogue names (category or tag) and their Vietnamese labels. */
const interestLabels: Record<string, string> = {
  Beach: 'Bãi biển',
  Culture: 'Văn hóa',
  Entertainment: 'Giải trí',
  Food: 'Ẩm thực',
  Historical: 'Lịch sử',
  Museum: 'Bảo tàng',
  'Natural attraction': 'Điểm tham quan thiên nhiên',
  Nature: 'Thiên nhiên',
  Spiritual: 'Tâm linh',
  'Theme park': 'Công viên chủ đề',
  'Water park': 'Công viên nước',
};

export function interestLabel(key: string): string {
  return interestLabels[key] ?? key;
}

export function optionLabel<K extends string>(labels: Record<K, string>, key: K): string {
  return labels[key] ?? key;
}
