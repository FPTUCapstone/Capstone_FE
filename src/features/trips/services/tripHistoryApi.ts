import { DEMO_TRIP_CARDS, DEMO_TRIP_SUMMARY } from '../data/tripDemoFixtures';
import type {
  TripCardDto,
  TripHistoryFilter,
  TripHistoryResponseDto,
} from '../types/tripHistory';
import { TripApiError } from '../types/tripHistory';

/**
 * Production gate for trip history demo fixtures.
 * Strictly requires non-production environment AND explicit NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'.
 * Production environment ALWAYS wins (returns false).
 */
export function isTripDemoAllowedInCurrentEnv(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'
  );
}

export interface GetTripHistoryOptions {
  allowDemo?: boolean;
}

export async function getTripHistory(
  filter: TripHistoryFilter,
  options?: GetTripHistoryOptions
): Promise<TripHistoryResponseDto> {
  const allowDemo = Boolean(options?.allowDemo) && isTripDemoAllowedInCurrentEnv();

  // DEMO MODE: filtered fixture evaluation
  if (allowDemo) {
    let result = DEMO_TRIP_CARDS.filter((t) => t.status === filter.tab);

    if (filter.tripType && filter.tripType !== 'ALL') {
      result = result.filter((t) => t.tripType === filter.tripType);
    }

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.trim().toLowerCase();
      result = result.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const opMatch = t.operatorName?.toLowerCase().includes(q) ?? false;
        const codeMatch = t.bookingCode?.toLowerCase().includes(q) ?? false;
        const stopsMatch = t.stopsSummary?.some((s) => s.toLowerCase().includes(q)) ?? false;
        return titleMatch || opMatch || codeMatch || stopsMatch;
      });
    }

    if (filter.fromDate) {
      const fromTime = new Date(filter.fromDate).getTime();
      if (!Number.isNaN(fromTime)) {
        result = result.filter((t) => new Date(t.departureDatetime).getTime() >= fromTime);
      }
    }

    if (filter.toDate) {
      const toTime = new Date(filter.toDate).getTime();
      if (!Number.isNaN(toTime)) {
        result = result.filter((t) => new Date(t.departureDatetime).getTime() <= toTime);
      }
    }

    return {
      status: 'SUCCESS',
      trips: result,
      summary: filter.tab === 'Completed' ? DEMO_TRIP_SUMMARY : undefined,
      totalCount: result.length,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 10,
      isDemo: true,
    };
  }

  // REAL PRODUCTION MODE: Call live Backend
  try {
    const params = new URLSearchParams();
    params.set('status', filter.tab);
    if (filter.tripType && filter.tripType !== 'ALL') params.set('tripType', filter.tripType);
    if (filter.searchQuery) params.set('query', filter.searchQuery);
    if (filter.fromDate) params.set('fromDate', filter.fromDate);
    if (filter.toDate) params.set('toDate', filter.toDate);

    const response = await fetch(`/api/v1/traveler/trips?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 404 || response.status === 501 || response.status === 502 || response.status === 503) {
      // Truthful pending backend notification
      return {
        status: 'PENDING_BE_INTEGRATION',
        message: 'Hệ thống lịch sử chuyến đi đang chờ kích hoạt dịch vụ máy chủ.',
        trips: [],
        totalCount: 0,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 10,
      };
    }

    if (!response.ok) {
      throw new TripApiError('Không thể tải lịch sử chuyến đi từ máy chủ.', response.status);
    }

    const data = await response.json();
    return {
      status: 'SUCCESS',
      trips: data.trips ?? [],
      summary: data.summary,
      totalCount: data.totalCount ?? 0,
      page: data.page ?? 1,
      pageSize: data.pageSize ?? 10,
    };
  } catch (err) {
    if (err instanceof TripApiError) {
      throw err;
    }
    // Network or server connection failure in real mode
    return {
      status: 'PENDING_BE_INTEGRATION',
      message: 'Hệ thống lịch sử chuyến đi đang chờ kích hoạt dịch vụ máy chủ.',
      trips: [],
      totalCount: 0,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 10,
    };
  }
}

export async function getTripById(
  tripId: string,
  options?: GetTripHistoryOptions
): Promise<TripCardDto | null> {
  const allowDemo = Boolean(options?.allowDemo) && isTripDemoAllowedInCurrentEnv();

  if (allowDemo) {
    const found = DEMO_TRIP_CARDS.find((t) => t.tripId === tripId);
    return found ?? null;
  }

  try {
    const response = await fetch(`/api/v1/traveler/trips/${encodeURIComponent(tripId)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (response.status === 404 || !response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
