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
 * Production capability for UC-07.
 *
 * Capstone_BE develop does not currently expose an authenticated Change
 * Password endpoint. A future verified adapter will implement
 * `AvailableChangePasswordCapability` and be injected by the actor-specific
 * page composition after its route, DTOs, auth transport, and session
 * semantics are confirmed. Traveler/Tour Operator and Administrator adapters
 * must continue using their separate canonical session architectures. Until
 * then, production cannot send credentials.
 */
export const pendingChangePasswordCapability: PendingChangePasswordCapability =
  Object.freeze({
    status: 'pending',
    integrationStatus: CHANGE_PASSWORD_INTEGRATION_STATUS,
  });
