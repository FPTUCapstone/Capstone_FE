import { DEMO_TRIP_CARDS } from '../data/tripDemoFixtures';
import { tripReviewEn } from '../resources/en';
import type { TripCardDto } from '../types/tripHistory';
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

/**
 * @deprecated Legacy lookup by a bare trip id, used only by the old review page. It targets a route that no
 * longer exists, so a real request ends as "not found". Trip History uses `tripHistoryClient`.
 */
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
          tripReviewEn.bff.tripHistoryPendingDetail,
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
      throw new TripApiError(MSG127_SYSTEM_ERROR, response.status, {
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
