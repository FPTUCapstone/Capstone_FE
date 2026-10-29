export const DEV_TOUR_TEXT_FILTERS = [
  'keyword', 'destination', 'startDate', 'endDate', 'minPrice', 'maxPrice',
  'durationDays', 'category', 'minimumRating', 'sort',
] as const;

export const DEV_TOUR_QUERY_KEYS = new Set<string>([...DEV_TOUR_TEXT_FILTERS, 'page', 'pageSize', 'mode']);
export const DEV_TOUR_SORTS = ['relevance', 'priceAsc', 'priceDesc', 'rating', 'departureDate'] as const;
export const DEV_TOUR_MODES = ['lexical', 'semantic', 'hybrid'] as const;
export const DEV_TOUR_PAGE_SIZE = 20;

export type DevTourSearchState = Record<typeof DEV_TOUR_TEXT_FILTERS[number], string> & {
  mode: string;
  page: number;
  pageSize: number;
};

export function parseDevTourSearchState(params: URLSearchParams): DevTourSearchState {
  const text = Object.fromEntries(DEV_TOUR_TEXT_FILTERS.map((key) => [key, (params.get(key) ?? '').trim()]));
  return {
    ...text,
    mode: params.get('mode') ?? 'lexical',
    page: Number(params.get('page') ?? '1'),
    pageSize: DEV_TOUR_PAGE_SIZE,
  } as DevTourSearchState;
}

export function buildDevTourQuery(state: DevTourSearchState): URLSearchParams {
  const query = new URLSearchParams();
  for (const key of DEV_TOUR_TEXT_FILTERS) {
    if (state[key].trim()) query.set(key, state[key].trim());
  }
  query.set('page', String(state.page));
  query.set('pageSize', String(DEV_TOUR_PAGE_SIZE));
  query.set('mode', state.mode);
  return query;
}

export function clearDevTourFilters(state: DevTourSearchState): DevTourSearchState {
  const keyword = state.keyword.trim();
  return {
    keyword,
    destination: '',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    durationDays: '',
    category: '',
    minimumRating: '',
    sort: keyword ? 'relevance' : 'departureDate',
    mode: state.mode,
    page: 1,
    pageSize: DEV_TOUR_PAGE_SIZE,
  };
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const instant = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(instant.getTime()) && instant.toISOString().slice(0, 10) === value;
}

export function validateDevTourFilters(state: DevTourSearchState): string | null {
  if (state.keyword.length > 300 || state.destination.length > 300 || state.category.length > 100) return 'Text filters exceed the supported length.';
  if (!DEV_TOUR_MODES.some((mode) => mode === state.mode)) return 'Select a supported search mode.';
  if (state.sort && !DEV_TOUR_SORTS.some((sort) => sort === state.sort)) return 'Select a supported sort order.';
  if (!Number.isSafeInteger(state.page) || state.page < 1 || state.pageSize !== DEV_TOUR_PAGE_SIZE) return 'Page must be positive and page size must be 20.';
  for (const key of ['minPrice', 'maxPrice', 'durationDays'] as const) {
    if (state[key] && (!/^\d+$/.test(state[key]) || !Number.isSafeInteger(Number(state[key])) || Number(state[key]) < (key === 'durationDays' ? 1 : 0))) return 'Prices must be non-negative whole numbers and duration must be positive.';
    if (state[key] && key !== 'durationDays' && Number(state[key]) > 9_999_999_999) return 'Price exceeds the supported VND range.';
  }
  if (state.minPrice && state.maxPrice && Number(state.minPrice) > Number(state.maxPrice)) return 'Minimum price cannot exceed maximum price.';
  if (state.minimumRating && (!Number.isFinite(Number(state.minimumRating)) || Number(state.minimumRating) < 1 || Number(state.minimumRating) > 5)) return 'Minimum rating must be between 1 and 5.';
  if ((state.startDate && !validDate(state.startDate)) || (state.endDate && !validDate(state.endDate))) return 'Enter valid calendar dates.';
  if (state.startDate && state.endDate && state.startDate > state.endDate) return 'Start date cannot be after end date.';
  return null;
}
