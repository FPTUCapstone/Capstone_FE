/**
 * @deprecated Compatibility contract for the legacy trip review flow only.
 * Preserves its existing DTO, English copy, and bare-trip lookup behavior;
 * new review flows must use the canonical review contract instead.
 * Browser-safe exports only; no server services belong in this entry point.
 */
export {
  getTripById,
  MSG127_SYSTEM_ERROR,
  PENDING_BE_INTEGRATION_ERROR_CODE,
} from './services/tripHistoryApi';
export type { TripCardDto } from './types/tripHistory';
export { tripReviewEn } from './resources/en';
