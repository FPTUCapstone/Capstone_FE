import { requestJson, bodyRecord } from '@/lib/jsonRequest';
import { getApiBase } from '@/lib/authApi';
import { AuthStorage } from '@/features/auth/session/authSession';
import { parseNotificationInboxResponse, NotificationParseError } from './parsers';
import type { NotificationInboxResponse } from './types';

export class NotificationsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'NotificationsApiError';
  }
}

function getAuthToken(): string {
  const token = AuthStorage.getAccessToken();
  if (!token) {
    throw new NotificationsApiError('Vui lòng đăng nhập để xem thông báo.', 401, 'AUTH_REQUIRED');
  }
  return token;
}

function handleFailure(status: number, body: unknown): never {
  const record = bodyRecord(body);
  const code = typeof record.code === 'string' ? record.code : (typeof record.detail === 'string' ? record.detail : undefined);
  const title = typeof record.title === 'string' ? record.title : 'Không thể kết nối dịch vụ thông báo. Vui lòng thử lại.';

  if (status === 401) {
    AuthStorage.clear();
    throw new NotificationsApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401, code ?? 'UNAUTHORIZED');
  }
  if (status === 403) {
    throw new NotificationsApiError('Bạn không có quyền truy cập thông báo này.', 403, code ?? 'FORBIDDEN');
  }
  if (status === 404) {
    throw new NotificationsApiError('Không tìm thấy thông báo.', 404, code ?? 'NOT_FOUND');
  }
  if (status === 400) {
    throw new NotificationsApiError(title, 400, code ?? 'BAD_REQUEST', record.errors);
  }

  throw new NotificationsApiError(title, status, code);
}

export interface GetNotificationInboxOptions {
  unreadOnly?: boolean;
  limit?: number;
  beforeId?: number;
  signal?: AbortSignal;
}

export async function getNotificationInbox(
  options?: GetNotificationInboxOptions
): Promise<NotificationInboxResponse> {
  const token = getAuthToken();
  const apiBase = getApiBase();

  const params = new URLSearchParams();
  if (options?.unreadOnly) params.set('unreadOnly', 'true');
  params.set('limit', String(options?.limit ?? 20));
  if (options?.beforeId) params.set('beforeId', String(options.beforeId));

  const url = `${apiBase}/notifications?${params.toString()}`;

  const response = await requestJson(url, {
    method: 'GET',
    accessToken: token,
    signal: options?.signal,
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-store' },
    networkError: () => new NotificationsApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseNotificationInboxResponse(response.body);
  } catch (error) {
    if (error instanceof NotificationParseError) {
      throw new NotificationsApiError('Dữ liệu thông báo từ máy chủ không hợp lệ.', 200, 'MALFORMED_RESPONSE', error.message);
    }
    throw error;
  }
}

export async function markNotificationRead(
  notificationId: number,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const url = `${apiBase}/notifications/${notificationId}/read`;

  const response = await requestJson(url, {
    method: 'POST',
    accessToken: token,
    signal: options?.signal,
    networkError: () => new NotificationsApiError('Không thể gửi yêu cầu đến máy chủ.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 204) {
    handleFailure(response.status, response.body);
  }
}
