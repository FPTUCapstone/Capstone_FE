import { getApiBase, type ApiError } from '@/lib/authApi';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresAtUtc?: string;
  message?: string;
}

/**
 * UC-07 Change Password — authenticated endpoint client.
 *
 * ⚠️ PENDING_BE_INTEGRATION:
 * The backend endpoint PUT /api/v1/auth/change-password is NOT YET
 * IMPLEMENTED in Capstone_BE. This client follows the projected contract
 * derived from SRS §3.2.7 and TripMate API conventions.
 *
 * When the backend endpoint is deployed, this function provides full integration.
 * In the interim, an uncontactable or 404 response safely falls back to a friendly
 * user notification (matching MSG127 behavior) rather than throwing an unhandled exception.
 */
export async function changePassword(
  data: ChangePasswordRequest,
  accessToken?: string,
): Promise<ChangePasswordResponse> {
  const API_BASE = getApiBase();
  let res: Response;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(data),
    });
  } catch {
    throw {
      code: 'NETWORK',
      message: 'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
      status: 0,
    } satisfies ApiError;
  }

  // Safe fallback if endpoint is not yet mounted on backend
  if (res.status === 404) {
    throw {
      code: 'ENDPOINT_NOT_DEPLOYED',
      message: 'Chức năng đổi mật khẩu đang được đồng bộ máy chủ. Vui lòng thử lại sau.',
      status: 404,
    } satisfies ApiError;
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      // non-JSON response
    }

    const errorCode = (body.errorCode as string) ?? (body.code as string) ?? undefined;
    const title = (body.message as string) ?? (body.title as string) ?? undefined;
    const rawErrors = body.errors as Record<string, string | string[]> | undefined;
    let fieldErrors: Record<string, string> | undefined;

    if (rawErrors && typeof rawErrors === 'object') {
      fieldErrors = Object.fromEntries(
        Object.entries(rawErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
      );
    }

    throw {
      code: errorCode,
      message: title,
      errors: fieldErrors,
      status: res.status,
    } satisfies ApiError;
  }

  let envelope: Record<string, unknown> = {};
  try {
    envelope = (await res.json()) as Record<string, unknown>;
  } catch {
    return { message: 'Password updated successfully.' };
  }

  if (envelope.data && typeof envelope.data === 'object') {
    return envelope.data as ChangePasswordResponse;
  }

  return envelope as ChangePasswordResponse;
}
