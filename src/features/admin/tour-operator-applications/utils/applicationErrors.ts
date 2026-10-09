import { ApiError } from '../api/tourOperatorApplicationApi';
import { UNCONFIRMED_RESPONSE } from '../api/errorCodes';
import { tourOperatorApplicationEn as copy } from '../resources/en';

export type ApplicationErrorKind =
  | 'sessionExpired'
  | 'forbidden'
  | 'notFound'
  | 'serviceUnavailable'
  | 'unconfirmed'
  | 'network'
  | 'other';

export interface ApplicationErrorView {
  readonly kind: ApplicationErrorKind;
  readonly message: string;
}

/**
 * Maps a failed request to user-facing copy. 401 (re-authentication) and 403 (missing
 * permission) stay distinct; validation failures keep the Backend's own explanation.
 */
export function describeApplicationError(error: unknown, userId: number): ApplicationErrorView {
  if (!(error instanceof ApiError)) {
    return error instanceof TypeError
      ? { kind: 'network', message: copy.errors.network }
      : { kind: 'other', message: copy.errors.unexpected };
  }
  if (error.errorCode === UNCONFIRMED_RESPONSE) return { kind: 'unconfirmed', message: copy.errors.unconfirmed };
  if (error.statusCode === 401) return { kind: 'sessionExpired', message: copy.errors.sessionExpired };
  if (error.statusCode === 403) return { kind: 'forbidden', message: copy.errors.forbidden };
  if (error.statusCode === 404) return { kind: 'notFound', message: copy.errors.notFound(userId) };
  if (error.statusCode >= 500) return { kind: 'serviceUnavailable', message: copy.errors.serviceUnavailable };
  return { kind: 'other', message: error.message || copy.errors.unexpected };
}
