import { requestJson, bodyRecord } from '@/lib/jsonRequest';
import { getApiBase } from '@/lib/authApi';
import { AuthStorage } from '@/features/auth/session/authSession';
import {
  parseEmergencyTourImpactResponse,
  parseEmergencyTourActionResponse,
  parseAddEmergencyTourEvidenceResponse,
  parseEmergencyTourEvidenceResponse,
  EmergencyTourParseError,
} from './parsers';
import type {
  EmergencyTourImpactResponse,
  CancelBeforeDepartureRequest,
  EmergencyStopActiveRequest,
  EmergencyTourActionResponse,
  AddEmergencyTourEvidenceRequest,
  EmergencyTourEvidenceResponse,
  AddEmergencyTourEvidenceResponse,
} from './types';

export class OperatorEmergencyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'OperatorEmergencyApiError';
  }
}

function getAuthToken(): string {
  const token = AuthStorage.getAccessToken();
  if (!token) {
    throw new OperatorEmergencyApiError('Authentication required.', 401, 'AUTH_REQUIRED');
  }
  return token;
}

function handleFailure(status: number, body: unknown): never {
  const record = bodyRecord(body);
  const code = typeof record.code === 'string' ? record.code : (typeof record.detail === 'string' ? record.detail : undefined);
  const title = typeof record.title === 'string' ? record.title : 'An error occurred during emergency tour operation.';

  if (status === 401) {
    AuthStorage.clear();
    throw new OperatorEmergencyApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401, code ?? 'UNAUTHORIZED');
  }
  if (status === 403) {
    throw new OperatorEmergencyApiError('Bạn không có quyền thực hiện thao tác khẩn cấp trên tour này.', 403, code ?? 'FORBIDDEN');
  }
  if (status === 404) {
    throw new OperatorEmergencyApiError('Không tìm thấy lịch khởi hành hoặc tour yêu cầu.', 404, code ?? 'NOT_FOUND');
  }
  if (status === 409) {
    throw new OperatorEmergencyApiError(title, 409, code ?? 'CONFLICT', record.errors);
  }
  if (status === 400) {
    throw new OperatorEmergencyApiError(title, 400, code ?? 'BAD_REQUEST', record.errors);
  }

  throw new OperatorEmergencyApiError(title, status, code);
}

export async function getEmergencyImpact(
  tourId: number,
  scheduleId: number,
  options?: { signal?: AbortSignal }
): Promise<EmergencyTourImpactResponse> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const url = `${apiBase}/operator/tours/${tourId}/schedules/${scheduleId}/emergency-impact`;

  const response = await requestJson(url, {
    method: 'GET',
    accessToken: token,
    signal: options?.signal,
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-store' },
    networkError: () => new OperatorEmergencyApiError('Không thể kết nối đến máy chủ.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseEmergencyTourImpactResponse(response.body);
  } catch (error) {
    if (error instanceof EmergencyTourParseError) {
      throw new OperatorEmergencyApiError('Dữ liệu tác động từ máy chủ không hợp lệ.', 200, 'MALFORMED_RESPONSE', error.message);
    }
    throw error;
  }
}

export async function cancelBeforeDeparture(
  tourId: number,
  scheduleId: number,
  request: CancelBeforeDepartureRequest,
  idempotencyKey: string,
  options?: { signal?: AbortSignal }
): Promise<EmergencyTourActionResponse> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const url = `${apiBase}/operator/tours/${tourId}/schedules/${scheduleId}/cancel-before-departure`;

  const response = await requestJson(url, {
    method: 'POST',
    accessToken: token,
    signal: options?.signal,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    jsonBody: request,
    networkError: () => new OperatorEmergencyApiError('Không thể gửi yêu cầu hủy lịch khởi hành.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseEmergencyTourActionResponse(response.body);
  } catch (error) {
    if (error instanceof EmergencyTourParseError) {
      throw new OperatorEmergencyApiError('Dữ liệu kết quả hủy tour từ máy chủ không hợp lệ.', 200, 'MALFORMED_RESPONSE', error.message);
    }
    throw error;
  }
}

export async function emergencyStopActive(
  tourId: number,
  scheduleId: number,
  request: EmergencyStopActiveRequest,
  idempotencyKey: string,
  options?: { signal?: AbortSignal }
): Promise<EmergencyTourActionResponse> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const url = `${apiBase}/operator/tours/${tourId}/schedules/${scheduleId}/emergency-stop`;

  const response = await requestJson(url, {
    method: 'POST',
    accessToken: token,
    signal: options?.signal,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    jsonBody: request,
    networkError: () => new OperatorEmergencyApiError('Không thể gửi yêu cầu dừng tour khẩn cấp.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseEmergencyTourActionResponse(response.body);
  } catch (error) {
    if (error instanceof EmergencyTourParseError) {
      throw new OperatorEmergencyApiError('Dữ liệu kết quả dừng tour từ máy chủ không hợp lệ.', 200, 'MALFORMED_RESPONSE', error.message);
    }
    throw error;
  }
}

export async function getEmergencyEvidence(
  tourId: number,
  scheduleId: number,
  options?: { signal?: AbortSignal }
): Promise<EmergencyTourEvidenceResponse> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const url = `${apiBase}/operator/tours/${tourId}/schedules/${scheduleId}/emergency-evidence`;

  const response = await requestJson(url, {
    method: 'GET',
    accessToken: token,
    signal: options?.signal,
    networkError: () => new OperatorEmergencyApiError('Không thể tải bằng chứng hiện tại.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseEmergencyTourEvidenceResponse(response.body);
  } catch (error) {
    if (error instanceof EmergencyTourParseError) {
      throw new OperatorEmergencyApiError('Dữ liệu bằng chứng từ máy chủ không hợp lệ.', 500, 'PARSE_ERROR');
    }
    throw error;
  }
}

export async function addEmergencyEvidence(
  tourId: number,
  scheduleId: number,
  request: AddEmergencyTourEvidenceRequest,
  options?: { signal?: AbortSignal }
): Promise<AddEmergencyTourEvidenceResponse> {
  const token = getAuthToken();
  const apiBase = getApiBase();
  const url = `${apiBase}/operator/tours/${tourId}/schedules/${scheduleId}/emergency-evidence`;

  const response = await requestJson(url, {
    method: 'PUT',
    accessToken: token,
    signal: options?.signal,
    jsonBody: request,
    networkError: () => new OperatorEmergencyApiError('Không thể cập nhật bằng chứng khẩn cấp.', 0, 'NETWORK_ERROR'),
  });

  if (response.status !== 200) {
    handleFailure(response.status, response.body);
  }

  try {
    return parseAddEmergencyTourEvidenceResponse(response.body);
  } catch (error) {
    if (error instanceof EmergencyTourParseError) {
      throw new OperatorEmergencyApiError('Dữ liệu kết quả bằng chứng từ máy chủ không hợp lệ.', 200, 'MALFORMED_RESPONSE', error.message);
    }
    throw error;
  }
}
