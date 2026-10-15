import {
  ChangePasswordApiError,
  type AvailableChangePasswordCapability,
  type ChangePasswordFormValues,
} from '@/features/account/security/changePasswordCapability';

const GENERIC_FAILURE_MESSAGE = 'Không thể đổi mật khẩu. Vui lòng thử lại.';
const CURRENT_PASSWORD_MISMATCH_MESSAGE = 'Mật khẩu hiện tại không đúng.';
const NEW_PASSWORD_POLICY_MESSAGE =
  'Mật khẩu mới không hợp lệ hoặc trùng với mật khẩu hiện tại.';
const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
const FORBIDDEN_MESSAGE = 'Bạn không có quyền thực hiện hành động này.';

interface ProblemBody {
  errorCode?: unknown;
}

/**
 * The proxy already clears the admin session cookie server-side on a 401
 * (changePasswordProxy.ts); this maps that status to `sessionExpired` so the
 * client redirects to admin sign-in instead of showing a generic error.
 */
async function toCapabilityError(response: Response): Promise<ChangePasswordApiError> {
  let body: ProblemBody = {};
  try {
    body = (await response.json()) as ProblemBody;
  } catch {
    // Non-JSON body stays a generic failure.
  }

  if (body.errorCode === 'MSG17') {
    return new ChangePasswordApiError(CURRENT_PASSWORD_MISMATCH_MESSAGE, 'currentPassword');
  }
  if (body.errorCode === 'MSG05') {
    return new ChangePasswordApiError(NEW_PASSWORD_POLICY_MESSAGE, 'newPassword');
  }
  if (response.status === 401) {
    return new ChangePasswordApiError(SESSION_EXPIRED_MESSAGE, undefined, 'sessionExpired');
  }
  if (response.status === 403) {
    return new ChangePasswordApiError(FORBIDDEN_MESSAGE, undefined, 'forbidden');
  }
  return new ChangePasswordApiError(GENERIC_FAILURE_MESSAGE);
}

/**
 * Real UC-07 capability for the Administrator/Staff BFF session, injected by
 * AdminChangePasswordView. Routes through the same-origin
 * /api/admin/account/security/change-password proxy — the admin session's
 * bearer token stays server-side; the browser only ever holds the signed
 * HttpOnly admin cookie.
 */
export function createAdminChangePasswordCapability(): AvailableChangePasswordCapability {
  return {
    status: 'available',
    async execute(values: Readonly<ChangePasswordFormValues>): Promise<void> {
      let response: Response;
      try {
        response = await fetch('/api/admin/account/security/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          }),
        });
      } catch {
        throw new ChangePasswordApiError(GENERIC_FAILURE_MESSAGE);
      }

      if (!response.ok) {
        throw await toCapabilityError(response);
      }
    },
  };
}
