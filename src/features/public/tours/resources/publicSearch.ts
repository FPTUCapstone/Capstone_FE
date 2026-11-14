import { formatDateTimeVietnam } from '../utils/tourQuery';

export type SearchLocale = 'en' | 'vi';
export const searchLocaleKey = 'tripmate.uc24.locale';

export function resolveSearchLocale(saved: string | null, browserLanguage: string): SearchLocale {
  if (saved === 'vi' || saved === 'en') return saved;
  return browserLanguage.toLowerCase().split('-')[0] === 'vi' ? 'vi' : 'en';
}

const en = {
  hero: {
    label: 'Explore tours', image: 'Explore Central Vietnam', badge: 'Local experiences in Central Vietnam',
    title: 'Discover', emphasis: 'memorable journeys',
    description: 'Find tours by destination, departure date and budget. All tours are reviewed and prices are shown upfront.',
    action: 'Explore tours',
  },
  language: 'Search language', filters: 'Tour search filters', keyword: 'Keyword',
  destination: 'Destination / Area', start: 'From date', end: 'To date',
  min: 'Minimum price', max: 'Maximum price', duration: 'Duration (days)',
  category: 'Category', rating: 'Minimum rating', sort: 'Sort by',
  allCategories: 'All categories', allRatings: 'Any rating', defaultSort: 'Default',
  relevance: 'Relevance', priceAsc: 'Price ascending', priceDesc: 'Price descending',
  ratingSort: 'Highest rated', departure: 'Departure date',
  loading: 'Searching…', search: 'Search tours', clear: 'Clear filters',
  retry: 'Try again', categoryError: 'Unable to load categories.',
  results: 'Search results', none: 'No results',
  empty: 'No tour packages found matching your destination and dates.',
  systemError: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  retained: 'Showing the last successful results.', shown: 'Displayed criteria',
  anyKeyword: 'any keyword', anyDestination: 'any destination',
  card: {
    soldOut: 'Sold out', availableSlots: (n: number) => `${n} places left`, available: 'Available',
    noSchedule: 'No upcoming departure', unknown: 'Availability unknown', days: (n: number) => `${n} days`,
    departure: 'Departure:', priceFrom: 'From', details: 'Details', detailsAria: (title: string) => `View details for ${title}`,
    rating: 'Rating', ratingUnknown: 'Not rated',
    formatDeparture: (value: string | null) => value ? formatDateTimeVietnam(value) : 'Not scheduled',
  },
  count: (shown: number, total: number) => `Showing ${shown} of ${total} matching tours`,
  pagination: {
    navigation: 'Tour results pages', previous: 'Previous page', previousShort: 'Previous',
    next: 'Next page', nextShort: 'Next', goToPage: (page: number) => `Go to page ${page}`,
    page: (page: number) => `Page ${page}`,
  },
};

const vi: Partial<typeof en> = {
  hero: {
    label: 'Khám phá hành trình du lịch', image: 'Khám phá du lịch Miền Trung',
    badge: 'Khám Phá Tour Trải Nghiệm Bản Địa Miền Trung',
    title: 'Khám phá những', emphasis: 'hành trình đáng nhớ',
    description: 'Tìm kiếm tour du lịch theo điểm đến, lịch khởi hành và ngân sách phù hợp. Mọi tour đều được kiểm duyệt chất lượng và đảm bảo giá minh bạch.',
    action: 'Khám phá tour',
  },
  language: 'Ngôn ngữ tìm kiếm', filters: 'Bộ lọc tìm kiếm tour', keyword: 'Từ khóa',
  destination: 'Điểm đến / Khu vực', start: 'Từ ngày', end: 'Đến ngày',
  min: 'Giá tối thiểu', max: 'Giá tối đa', duration: 'Thời lượng (ngày)',
  category: 'Danh mục', rating: 'Đánh giá tối thiểu', sort: 'Sắp xếp',
  allCategories: 'Tất cả danh mục', allRatings: 'Mọi đánh giá', defaultSort: 'Mặc định',
  relevance: 'Phù hợp nhất', priceAsc: 'Giá tăng dần', priceDesc: 'Giá giảm dần',
  ratingSort: 'Đánh giá cao', departure: 'Ngày khởi hành',
  loading: 'Đang tìm kiếm…', search: 'Tìm kiếm tour', clear: 'Xóa bộ lọc',
  retry: 'Thử lại', categoryError: 'Không thể tải danh mục.',
  results: 'Kết Quả Tìm Kiếm', none: 'Không có kết quả nào',
  empty: 'Không tìm thấy gói tour phù hợp với điểm đến và ngày của bạn.',
  systemError: 'TripMate tạm thời không thể xử lý yêu cầu của bạn. Vui lòng kiểm tra kết nối và thử lại.',
  retained: 'Đang giữ kết quả thành công gần nhất.', shown: 'Tiêu chí đang hiển thị',
  anyKeyword: 'mọi từ khóa', anyDestination: 'mọi điểm đến',
  card: {
    soldOut: 'Hết chỗ', availableSlots: (n) => `Còn ${n} chỗ`, available: 'Còn chỗ',
    noSchedule: 'Chưa có lịch khởi hành', unknown: 'Chưa xác định', days: (n) => `${n} ngày`,
    departure: 'Khởi hành:', priceFrom: 'Giá từ', details: 'Chi tiết', detailsAria: (title) => `Xem chi tiết tour ${title}`,
    rating: 'Đánh giá', ratingUnknown: 'Chưa có đánh giá',
    formatDeparture: (value: string | null) => value ? formatDateTimeVietnam(value) : 'Chưa có lịch',
  },
  count: (shown, total) => `Hiển thị ${shown} trong tổng số ${total} tour phù hợp`,
  pagination: {
    navigation: 'Phân trang danh sách tour', previous: 'Trang trước', previousShort: 'Trước',
    next: 'Trang tiếp theo', nextShort: 'Sau', goToPage: (page) => `Đến trang ${page}`,
    page: (page) => `Trang ${page}`,
  },
};

export function publicSearchCopy(locale: SearchLocale) {
  return locale === 'vi' ? { ...en, ...vi } : en;
}

export function resolveSearchText(
  key: string,
  locale: SearchLocale,
  english: Readonly<Record<string, string>>,
  vietnamese: Readonly<Record<string, string>>,
): string {
  const lookup = (catalog: Readonly<Record<string, string>>) =>
    Object.hasOwn(catalog, key) ? catalog[key] : undefined;
  return (locale === 'vi' ? lookup(vietnamese) : undefined) ?? lookup(english) ?? '—';
}

const validationEn: Record<string, string> = {
  'Từ khóa không được vượt quá 300 ký tự.': 'Enter at most 300 characters for the keyword.',
  'Tên điểm đến không được vượt quá 300 ký tự.': 'Enter at most 300 characters for the destination.',
  'Ngày chính xác không thể dùng cùng khoảng ngày.': 'An exact date cannot be used with a date range.',
  'Giá tối thiểu phải là số nguyên từ 0 đến 9.999.999.999 VNĐ.': 'Minimum price must be a whole number from 0 to 9,999,999,999 VND.',
  'Giá tối đa phải là số nguyên từ 0 đến 9.999.999.999 VNĐ.': 'Maximum price must be a whole number from 0 to 9,999,999,999 VND.',
  'Khoảng giá không hợp lệ. Giá tối thiểu không được lớn hơn giá tối đa.': 'Minimum price cannot exceed maximum price.',
  'Ngày khởi hành phải đúng định dạng YYYY-MM-DD.': 'Departure date must use YYYY-MM-DD.',
  'Khoảng ngày phải đúng định dạng YYYY-MM-DD.': 'Date ranges must use YYYY-MM-DD.',
  'Ngày bắt đầu không được sau ngày kết thúc (MSG158).': 'Start date cannot be after end date.',
  'Thời lượng phải là số ngày nguyên dương.': 'Duration must be a positive whole number of days.',
  'Đánh giá tối thiểu phải từ 1 đến 5.': 'Minimum rating must be between 1 and 5.',
  'Cách sắp xếp không hợp lệ.': 'Select a valid sort option.',
};

export function searchValidationCopy(message: string, locale: SearchLocale) {
  return resolveSearchText(message, locale, validationEn, { [message]: message });
}
