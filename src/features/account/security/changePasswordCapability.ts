export const CHANGE_PASSWORD_INTEGRATION_STATUS = 'PENDING_BE_INTEGRATION' as const;

/** Frontend form values only. The future Backend DTO remains intentionally undefined. */
export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PendingChangePasswordCapability {
  readonly status: 'pending';
  readonly integrationStatus: typeof CHANGE_PASSWORD_INTEGRATION_STATUS;
}

export interface AvailableChangePasswordCapability {
  readonly status: 'available';
  readonly execute: (values: Readonly<ChangePasswordFormValues>) => Promise<void>;
}

export type ChangePasswordCapability =
  | PendingChangePasswordCapability
  | AvailableChangePasswordCapability;

/**
 * Thrown by an `AvailableChangePasswordCapability.execute` adapter.
 *
 * - `field` routes the message to the matching form field (BE spec §5:
 *   `MSG17` -> currentPassword, `MSG05` -> newPassword).
 * - `kind: 'sessionExpired'` (401) means the caller's session is no longer
 *   valid; the page must clear it and redirect to sign-in (UC-07 spec §6/§7).
 * - `kind: 'forbidden'` (403, excluding the local-password-unavailable case
 *   surfaced as a plain message) means the caller is not authorized for this
 *   action; the page shows an access-denied message without clearing a
 *   valid session.
 * - Omit both for a safe generic form-level failure (network, 5xx/MSG127).
 */
export class ChangePasswordApiError extends Error {
  constructor(
    message: string,
    public readonly field?: 'currentPassword' | 'newPassword',
    public readonly kind?: 'sessionExpired' | 'forbidden',
  ) {
    super(message);
    this.name = 'ChangePasswordApiError';
  }
}

/**
 * Fallback capability for an actor/route whose adapter is not yet injected
 * by its page composition. Traveler/Tour Operator and Administrator each use
 * their own canonical session architecture and inject a real
 * `AvailableChangePasswordCapability` (see webChangePasswordCapability.ts and
 * the admin account feature) once wired; production never sends credentials
 * through this pending placeholder.
 */
export const pendingChangePasswordCapability: PendingChangePasswordCapability =
  Object.freeze({
    status: 'pending',
    integrationStatus: CHANGE_PASSWORD_INTEGRATION_STATUS,
  });
