import { isApiError, webChangePassword } from '@/lib/authApi';

import {
  ChangePasswordApiError,
  type AvailableChangePasswordCapability,
  type ChangePasswordFormValues,
} from './changePasswordCapability';

const GENERIC_FAILURE_MESSAGE = 'Không thể đổi mật khẩu. Vui lòng thử lại.';
const CURRENT_PASSWORD_MISMATCH_MESSAGE = 'Mật khẩu hiện tại không đúng.';
const NEW_PASSWORD_POLICY_MESSAGE =
  'Mật khẩu mới không hợp lệ hoặc trùng với mật khẩu hiện tại.';

/**
 * Maps the Backend's stable errorCode (UC-07 spec §5) to the matching form
 * field. Any other code — 401 (session expired), 403 (no local password),
 * MSG127/5xx, network — surfaces as a safe generic form failure.
 */
function toCapabilityError(error: unknown): ChangePasswordApiError {
  if (isApiError(error)) {
    if (error.code === 'MSG17') {
      return new ChangePasswordApiError(CURRENT_PASSWORD_MISMATCH_MESSAGE, 'currentPassword');
    }
    if (error.code === 'MSG05') {
      return new ChangePasswordApiError(NEW_PASSWORD_POLICY_MESSAGE, 'newPassword');
    }
  }
  return new ChangePasswordApiError(GENERIC_FAILURE_MESSAGE);
}

/**
 * Real UC-07 capability for the public (Traveler / Tour Operator) Web
 * session, injected by ChangePasswordPage once the actor is confirmed
 * non-Administrator. `confirmPassword` is intentionally dropped: it is a
 * Web-only confirmation field and is never sent to the Backend.
 */
export function createWebChangePasswordCapability(): AvailableChangePasswordCapability {
  return {
    status: 'available',
    async execute(values: Readonly<ChangePasswordFormValues>): Promise<void> {
      try {
        await webChangePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
      } catch (error) {
        throw toCapabilityError(error);
      }
    },
  };
}
