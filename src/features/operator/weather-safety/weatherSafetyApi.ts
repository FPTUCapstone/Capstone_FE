import { requestJson, bodyRecord } from '@/lib/jsonRequest';
import { getApiBase } from '@/lib/authApi';
import { AuthStorage } from '@/features/auth/session/authSession';
import {
  parseWeatherSafetyReview,
  parseWeatherSafetyReviewList,
  WeatherSafetyReviewParseError,
} from './parsers';
import type { WeatherSafetyReview, AcknowledgeReviewRequest } from './types';
import { firstValidationMessage } from '@/features/operator/tours/emergency/firstValidationMessage';

export class WeatherSafetyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WeatherSafetyApiError';
  }
}

function getAuthToken(): string {
  const token = AuthStorage.getAccessToken();
  if (!token) {
    throw new WeatherSafetyApiError('Vui lòng đăng nhập để xem cảnh báo an toàn.', 401, 'AUTH_REQUIRED');
  }
  return token;
}

function handleFailure(status: number, body: unknown): never {
  const record = bodyRecord(body);
  const code = typeof record.code === 'string' ? record.code : (typeof record.detail === 'string' ? record.detail : undefined);
  const title = typeof record.title === 'string' ? record.title : 'Không thể kết nối dịch vụ cảnh báo an toàn. Vui lòng thử lại.';

  if (status === 401) {
    AuthStorage.clear();
    throw new WeatherSafetyApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401, code ?? 'UNAUTHORIZED');
  }
  if (status === 403) {
    throw new WeatherSafetyApiError('Bạn không có quyền truy cập cảnh báo an toàn này.', 403, code ?? 'FORBIDDEN');
  }
  if (status === 404) {
    throw new WeatherSafetyApiError('Không tìm thấy bản ghi cảnh báo an toàn thời tiết.', 404, code ?? 'NOT_FOUND');
  }
  if (status === 400) {
    throw new WeatherSafetyApiError(firstValidationMessage(record.errors) ?? title, 400, code ?? 'BAD_REQUEST', record.errors);
  }

  throw new WeatherSafetyApiError(title, status, code);
}

export async function listWeatherSafetyReviews(
  status?: string,
  options?: { signal?: AbortSignal }
): Promise<WeatherSafetyReview[]> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const queryParam = status && status.trim() ? `?status=${encodeURIComponent(status.trim())}` : '';
  const url = `${apiBase}/operator/weather-safety-reviews${queryParam}`;

  const response = await requestJson(url, {
    method: 'GET',
    accessToken: token,
    signal: options?.signal,
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-store' },
    networkError: () => new WeatherSafetyApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseWeatherSafetyReviewList(response.body);
  } catch (error) {
    if (error instanceof WeatherSafetyReviewParseError) {
      throw new WeatherSafetyApiError('Dữ liệu danh sách cảnh báo từ máy chủ không hợp lệ.', 200, 'MALFORMED_RESPONSE', error.message);
    }
    throw error;
  }
}

export async function getWeatherSafetyReview(
  reviewId: number,
  options?: { signal?: AbortSignal }
): Promise<WeatherSafetyReview> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const url = `${apiBase}/operator/weather-safety-reviews/${reviewId}`;

  const response = await requestJson(url, {
    method: 'GET',
    accessToken: token,
    signal: options?.signal,
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-store' },
    networkError: () => new WeatherSafetyApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseWeatherSafetyReview(response.body);
  } catch (error) {
    if (error instanceof WeatherSafetyReviewParseError) {
      throw new WeatherSafetyApiError('Dữ liệu chi tiết cảnh báo từ máy chủ không hợp lệ.', 200, 'MALFORMED_RESPONSE', error.message);
    }
    throw error;
  }
}

export async function acknowledgeWeatherSafetyReview(
  reviewId: number,
  body: AcknowledgeReviewRequest,
  options?: { signal?: AbortSignal }
): Promise<WeatherSafetyReview> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const url = `${apiBase}/operator/weather-safety-reviews/${reviewId}/acknowledge`;

  const response = await requestJson(url, {
    method: 'POST',
    accessToken: token,
    signal: options?.signal,
    jsonBody: {
      immediateInstructions: body.immediateInstructions?.trim() || null,
    },
    networkError: () => new WeatherSafetyApiError('Không thể gửi xác nhận đến máy chủ.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseWeatherSafetyReview(response.body);
  } catch (error) {
    if (error instanceof WeatherSafetyReviewParseError) {
      throw new WeatherSafetyApiError('Dữ liệu xác nhận cảnh báo từ máy chủ không hợp lệ.', 200, 'MALFORMED_RESPONSE', error.message);
    }
    throw error;
  }
}

export async function getWeatherSafetyReviewBadgeCount(
  options?: { signal?: AbortSignal }
): Promise<number> {
  try {
    const reviews = await listWeatherSafetyReviews(undefined, options);
    return reviews.filter(
      (r) => r.status === 'PendingAcknowledgement' || r.status === 'Escalated'
    ).length;
  } catch {
    return 0;
  }
}
