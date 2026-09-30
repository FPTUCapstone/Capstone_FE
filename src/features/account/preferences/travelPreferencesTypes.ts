export type TravelInterestId =
  | 'culture'
  | 'nature'
  | 'food'
  | 'adventure'
  | 'relaxation'
  | 'shopping'
  | 'museum'
  | 'nightlife';

export type TravelStyleId = 'solo' | 'couple' | 'family' | 'group';

export type BudgetLevelId = 'economy' | 'standard' | 'premium';

export type PreferredTransportId = 'walking' | 'motorbike' | 'car' | 'publicTransit';

export type TravelPaceId = 'relaxed' | 'balanced' | 'packed';

export type FoodPreferenceId = 'noRestriction' | 'vegetarian' | 'halal' | 'noSeafood';

export interface TravelPreferencesData {
  interests: TravelInterestId[];
  travelStyle: TravelStyleId | null;
  budgetLevel: BudgetLevelId | null;
  preferredTransport: PreferredTransportId;
  travelPace: TravelPaceId;
  foodPreference: FoodPreferenceId;
  autoApplyToPlans: boolean;
  updatedAt?: string;
}

export interface InterestOption {
  id: TravelInterestId;
  label: string;
  icon: string;
  description: string;
}

export interface TravelStyleOption {
  id: TravelStyleId;
  label: string;
  subtitle: string;
  icon: string;
}

export interface BudgetLevelOption {
  id: BudgetLevelId;
  label: string;
  subtitle: string;
  rangeDescription: string;
  icon: string;
}

export interface TransportOption {
  id: PreferredTransportId;
  label: string;
  icon: string;
}

export interface PaceOption {
  id: TravelPaceId;
  label: string;
  description: string;
}

export interface FoodOption {
  id: FoodPreferenceId;
  label: string;
  icon: string;
}

export const INTEREST_OPTIONS: readonly InterestOption[] = [
  {
    id: 'culture',
    label: 'Văn hóa & Di sản',
    icon: 'museum',
    description: 'Di tích lịch sử, kiến trúc cổ, lễ hội dân gian và văn hóa bản địa',
  },
  {
    id: 'nature',
    label: 'Thiên nhiên & Sinh thái',
    icon: 'park',
    description: 'Vườn quốc gia, thác nước, núi rừng và danh lam thắng cảnh sinh thái',
  },
  {
    id: 'food',
    label: 'Ẩm thực & Chợ đêm',
    icon: 'restaurant',
    description: 'Đặc sản địa phương, phố đi bộ, ẩm thực đường phố và chợ truyền thống',
  },
  {
    id: 'adventure',
    label: 'Phiêu lưu & Khám phá',
    icon: 'hiking',
    description: 'Trekking rừng núi, chèo sup, hang động và hoạt động cảm giác mạnh',
  },
  {
    id: 'relaxation',
    label: 'Nghỉ dưỡng & Biển',
    icon: 'beach_access',
    description: 'Bãi biển trong xanh, resort thư giãn, suối khoáng nóng và spa',
  },
  {
    id: 'shopping',
    label: 'Mua sắm & Giải trí',
    icon: 'shopping_bag',
    description: 'Trung tâm thương mại, khu vui chơi chủ đề và quà lưu niệm thủ công',
  },
  {
    id: 'museum',
    label: 'Bảo tàng & Triển lãm',
    icon: 'history_edu',
    description: 'Không gian mỹ thuật đương đại, bảo tàng lịch sử và khu trưng bày',
  },
  {
    id: 'nightlife',
    label: 'Cuộc sống về đêm',
    icon: 'nightlife',
    description: 'Quán bar sân thượng, nhạc sống acoustic, phố đêm và dạo phố ngắm cảnh',
  },
];

export const TRAVEL_STYLE_OPTIONS: readonly TravelStyleOption[] = [
  {
    id: 'solo',
    label: 'Đi một mình (Solo)',
    subtitle: 'Tự do trải nghiệm, linh hoạt thời gian theo nhịp sống riêng',
    icon: 'person',
  },
  {
    id: 'couple',
    label: 'Cặp đôi (Couple)',
    subtitle: 'Không gian lãng mạn, ẩm thực tinh tế và điểm ngắm hoàng hôn',
    icon: 'favorite',
  },
  {
    id: 'family',
    label: 'Gia đình (Family)',
    subtitle: 'Tiện nghi an toàn, thân thiện với trẻ nhỏ và người cao tuổi',
    icon: 'family_restroom',
  },
  {
    id: 'group',
    label: 'Nhóm bạn (Group)',
    subtitle: 'Hoạt động gắn kết năng động, check-in sôi nổi và tiệc đêm',
    icon: 'groups',
  },
];

export const BUDGET_LEVEL_OPTIONS: readonly BudgetLevelOption[] = [
  {
    id: 'economy',
    label: 'Tiết kiệm (Economy)',
    subtitle: 'Tối ưu ngân sách thông minh',
    rangeDescription: 'Dưới 1.000.000đ / ngày',
    icon: 'payments',
  },
  {
    id: 'standard',
    label: 'Tiêu chuẩn (Standard)',
    subtitle: 'Cân bằng tiện nghi & chi phí hợp lý',
    rangeDescription: '1.000.000đ – 3.000.000đ / ngày',
    icon: 'account_balance_wallet',
  },
  {
    id: 'premium',
    label: 'Cao cấp (Premium)',
    subtitle: 'Dịch vụ sang trọng & trải nghiệm riêng',
    rangeDescription: 'Trên 3.000.000đ / ngày',
    icon: 'diamond',
  },
];

export const TRANSPORT_OPTIONS: readonly TransportOption[] = [
  { id: 'motorbike', label: 'Xe máy', icon: 'two_wheeler' },
  { id: 'car', label: 'Ô tô / Taxi', icon: 'directions_car' },
  { id: 'walking', label: 'Đi bộ', icon: 'directions_walk' },
  { id: 'publicTransit', label: 'Xe buýt / Công cộng', icon: 'directions_bus' },
];

export const PACE_OPTIONS: readonly PaceOption[] = [
  { id: 'relaxed', label: 'Thư thái', description: '1–2 điểm đến mỗi ngày, nhiều thời gian nghỉ dưỡng' },
  { id: 'balanced', label: 'Cân bằng', description: '3–4 điểm đến, phối hợp tham quan và trải nghiệm ẩm thực' },
  { id: 'packed', label: 'Dày đặc', description: 'Khám phá tối đa các danh thắng, lịch trình liên tục sôi nổi' },
];

export const FOOD_OPTIONS: readonly FoodOption[] = [
  { id: 'noRestriction', label: 'Không kiêng', icon: 'restaurant_menu' },
  { id: 'vegetarian', label: 'Ăn chay', icon: 'spa' },
  { id: 'halal', label: 'Halal', icon: 'check_circle' },
  { id: 'noSeafood', label: 'Không hải sản', icon: 'no_food' },
];

export const DEFAULT_PREFERENCES: TravelPreferencesData = {
  interests: ['nature', 'food', 'culture'],
  travelStyle: 'couple',
  budgetLevel: 'standard',
  preferredTransport: 'motorbike',
  travelPace: 'balanced',
  foodPreference: 'noRestriction',
  autoApplyToPlans: true,
};
