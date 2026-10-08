import { DEMO_TRIP_CARDS, DEMO_TRIP_SUMMARY } from '../data/tripDemoFixtures';
import { tripReviewEn } from '../resources/en';
import type {
  TripCardDto,
  TripHistoryFilter,
  TripHistoryResponseDto,
} from '../types/tripHistory';
import { TripApiError } from '../types/tripHistory';
export { TripApiError };

export const PENDING_BE_INTEGRATION_ERROR_CODE = 'PENDING_BE_INTEGRATION';

export const MSG127_SYSTEM_ERROR = tripReviewEn.errors.systemError;

function isVerifiedPendingIntegrationPayload(
  payload: unknown
): payload is { errorCode: string; detail?: string } {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { errorCode?: unknown }).errorCode === PENDING_BE_INTEGRATION_ERROR_CODE
  );
}

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

function parseVietnamDateBoundaryMs(dateStr: string, isEndOfDay: boolean): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (match) {
    const [, y, m, d] = match;
    const timePart = isEndOfDay ? '23:59:59.999' : '00:00:00.000';
    return new Date(`${y}-${m}-${d}T${timePart}+07:00`).getTime();
  }
  return new Date(dateStr).getTime();
}

export async function getTripHistory(
  filter: TripHistoryFilter,
  options?: GetTripHistoryOptions
): Promise<TripHistoryResponseDto> {
  const allowDemo = Boolean(options?.allowDemo) && isTripDemoAllowedInCurrentEnv();
  const page = filter.page && filter.page > 0 ? filter.page : 1;
  const pageSize = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : 20;

  // DEMO MODE: filtered and paginated fixture evaluation
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
      const fromTime = parseVietnamDateBoundaryMs(filter.fromDate, false);
      if (!Number.isNaN(fromTime)) {
        result = result.filter((t) => new Date(t.departureDatetime).getTime() >= fromTime);
      }
    }

    if (filter.toDate) {
      const toTime = parseVietnamDateBoundaryMs(filter.toDate, true);
      if (!Number.isNaN(toTime)) {
        result = result.filter((t) => new Date(t.departureDatetime).getTime() <= toTime);
      }
    }

    // Default sorting by departure date descending (Report 3 §3.7.1)
    result.sort(
      (a, b) => new Date(b.departureDatetime).getTime() - new Date(a.departureDatetime).getTime()
    );

    const totalCount = result.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedTrips = result.slice(startIndex, startIndex + pageSize);

    return {
      status: 'SUCCESS',
      trips: paginatedTrips,
      summary: filter.tab === 'Completed' ? DEMO_TRIP_SUMMARY : undefined,
      totalCount,
      page,
      pageSize,
      isDemo: true,
    };
  }

  // REAL PRODUCTION MODE: Call verified Next.js BFF route
  try {
    const params = new URLSearchParams();
    params.set('status', filter.tab);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
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

    if (response.status === 501) {
      const pendingPayload = await response.json().catch(() => null);
      if (isVerifiedPendingIntegrationPayload(pendingPayload)) {
        return {
          status: 'PENDING_BE_INTEGRATION',
          message:
            typeof pendingPayload.detail === 'string' && pendingPayload.detail.trim().length > 0
              ? pendingPayload.detail
              : tripReviewEn.bff.tripHistoryPendingDetail,
          trips: [],
          totalCount: 0,
          page,
          pageSize,
        };
      }
      throw new TripApiError(MSG127_SYSTEM_ERROR, 501, {
        ...(typeof pendingPayload === 'object' ? pendingPayload : {}),
        errorCode: 'MSG127',
      });
    }

    if (response.status === 404) {
      const notFoundData = await response.json().catch(() => null);
      throw new TripApiError(
        notFoundData?.detail ||
          notFoundData?.title ||
          tripReviewEn.errors.tripNotFound,
        404,
        { ...(typeof notFoundData === 'object' ? notFoundData : {}), errorCode: 'TRIP_NOT_FOUND' }
      );
    }

    if (response.status === 401 || response.status === 403) {
      const authErrorData = await response.json().catch(() => null);
      throw new TripApiError(
        authErrorData?.detail ||
          authErrorData?.title ||
          tripReviewEn.errors.tripHistoryAccessDenied,
        response.status,
        { ...(typeof authErrorData === 'object' ? authErrorData : {}), errorCode: 'MSG126' }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      // For HTTP 5xx (500-599), ALWAYS standardize to canonical English system error copy; never expose raw server title
      const msg =
        response.status >= 500 && response.status <= 599
          ? MSG127_SYSTEM_ERROR
          : errorData?.detail || errorData?.title || MSG127_SYSTEM_ERROR;
      throw new TripApiError(msg, response.status, {
        ...(typeof errorData === 'object' ? errorData : {}),
        errorCode: response.status >= 500 && response.status <= 599 ? 'MSG127' : undefined,
      });
    }

    const data = await response.json();
    return {
      status: 'SUCCESS',
      trips: data.trips ?? [],
      summary: data.summary,
      totalCount: data.totalCount ?? 0,
      page: data.page ?? page,
      pageSize: data.pageSize ?? pageSize,
    };
  } catch (err) {
    if (err instanceof TripApiError) {
      throw err;
    }
    // Network or server connection failure (including timeout/AbortError) in real mode is an ERROR with MSG127, NOT pending integration
    throw new TripApiError(MSG127_SYSTEM_ERROR, 0, { errorCode: 'MSG127' });
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

    if (response.status === 501) {
      const pendingPayload = await response.json().catch(() => null);
      if (isVerifiedPendingIntegrationPayload(pendingPayload)) {
        throw new TripApiError(
          typeof pendingPayload.detail === 'string' && pendingPayload.detail.trim().length > 0
            ? pendingPayload.detail
            : tripReviewEn.bff.tripHistoryPendingDetail,
          501,
          { errorCode: PENDING_BE_INTEGRATION_ERROR_CODE }
        );
      }
      throw new TripApiError(MSG127_SYSTEM_ERROR, 501, {
        ...(typeof pendingPayload === 'object' ? pendingPayload : {}),
        errorCode: 'MSG127',
      });
    }

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401 || response.status === 403) {
      throw new TripApiError(
        tripReviewEn.errors.tripDetailAccessDenied,
        response.status,
        { errorCode: 'MSG126' }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const msg =
        response.status >= 500 && response.status <= 599
          ? MSG127_SYSTEM_ERROR
          : errorData?.detail || errorData?.title || MSG127_SYSTEM_ERROR;
      throw new TripApiError(msg, response.status, {
        ...(typeof errorData === 'object' ? errorData : {}),
        errorCode: response.status >= 500 && response.status <= 599 ? 'MSG127' : undefined,
      });
    }

    return await response.json();
  } catch (err) {
    if (err instanceof TripApiError) {
      throw err;
    }
    throw new TripApiError(MSG127_SYSTEM_ERROR, 0, { errorCode: 'MSG127' });
  }
}
