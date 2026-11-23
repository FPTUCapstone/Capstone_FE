/**
 * TripMate UC-18 / UC-19 — Travel Group Management Client
 * Connects to ASP.NET Core 8 backend endpoint POST /api/v1/travel-groups/join
 * with Idempotency-Key header and Bearer token.
 */

import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';
import { bodyRecord } from '@/lib/jsonRequest';

export interface JoinTravelGroupResponse {
  groupId: number;
  groupName: string;
  itineraryId: number;
}

export class TravelGroupHttpError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'TravelGroupHttpError';
    this.status = status;
    this.code = code;
  }
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Joins a travel group using an 8-character invitation code.
 * Follows SRS V2 UC-19 and BR-44, BR-45, BR-46, BR-47.
 */
export async function joinTravelGroup(
  invitationCode: string,
  options?: { accessToken?: string; idempotencyKey?: string },
): Promise<JoinTravelGroupResponse> {
  const trimmed = invitationCode.trim();
  if (!trimmed) {
    throw new TravelGroupHttpError(400, 'Trường này là bắt buộc.', 'validation.required');
  }

  const token = options?.accessToken ?? AuthStorage.getContext()?.accessToken;
  const idempotencyKey = options?.idempotencyKey ?? generateIdempotencyKey();

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/travel-groups/join`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Idempotency-Key': idempotencyKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ invitationCode: trimmed }),
    });
  } catch {
    throw new TravelGroupHttpError(
      503,
      'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
      'network.unavailable',
    );
  }

  if (response.status === 200) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new TravelGroupHttpError(
        502,
        'Dữ liệu phản hồi từ máy chủ không hợp lệ.',
        'server.malformed_response',
      );
    }

    const rec = bodyRecord(body);
    const groupId = Number(rec.groupId);
    const itineraryId = Number(rec.itineraryId);
    const groupName = typeof rec.groupName === 'string' ? rec.groupName : 'Nhóm du lịch';

    if (isNaN(groupId) || isNaN(itineraryId)) {
      throw new TravelGroupHttpError(
        502,
        'Cấu trúc dữ liệu phản hồi không hợp lệ.',
        'server.invalid_contract',
      );
    }

    return {
      groupId,
      groupName,
      itineraryId,
    };
  }

  // Handle known error codes according to SRS V2
  let errorPayload: Record<string, unknown> = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === 'object') {
      errorPayload = parsed as Record<string, unknown>;
    }
  } catch {
    // Body is not json
  }

  const errorCode = typeof errorPayload.errorCode === 'string' ? errorPayload.errorCode : undefined;

  if (response.status === 409 || errorCode === 'travel_group.already_active_member') {
    throw new TravelGroupHttpError(
      409,
      'Bạn đã là thành viên của nhóm du lịch này.',
      'travel_group.already_active_member',
    );
  }

  if (response.status === 400 || errorCode === 'travel_group.invitation_unavailable') {
    throw new TravelGroupHttpError(
      400,
      'Mã lời mời không hợp lệ, đã hết hạn hoặc không còn khả dụng. Vui lòng kiểm tra lại.',
      'travel_group.invitation_unavailable',
    );
  }

  if (response.status === 401) {
    throw new TravelGroupHttpError(
      401,
      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      'auth.unauthorized',
    );
  }

  if (response.status === 403) {
    throw new TravelGroupHttpError(
      403,
      'Bạn không có quyền truy cập chức năng này.',
      'auth.forbidden',
    );
  }

  throw new TravelGroupHttpError(
    response.status,
    'TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.',
    errorCode ?? 'server.error',
  );
}

export interface GroupMessageApiDto {
  messageId: number;
  groupId: number;
  senderUserId: number;
  senderName: string;
  senderAvatarUrl?: string;
  messageType: 'text' | 'broadcast' | 'roll_call' | 'split_bill' | 'poll';
  content: string;
  metadataJson?: string;
  createdAtUtc: string;
  readByCount: number;
  isReadByMe: boolean;
  presentCount: number;
  isPresentByMe: boolean;
  paidUserIds: number[];
  pollVoteCounts: Record<number, number>;
  myPollVoteOption?: number | null;
}

async function requestWithAuth<T>(
  url: string,
  method: 'GET' | 'POST',
  body?: unknown,
): Promise<T> {
  const token = AuthStorage.getContext()?.accessToken;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new TravelGroupHttpError(
      503,
      'TripMate tạm thời không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
      'network.unavailable',
    );
  }

  if (response.ok) {
    if (response.status === 204) return {} as T;
    try {
      return (await response.json()) as T;
    } catch {
      throw new TravelGroupHttpError(502, 'Dữ liệu phản hồi từ máy chủ không hợp lệ.', 'server.malformed_response');
    }
  }

  let errorPayload: Record<string, unknown> = {};
  try {
    errorPayload = (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-json error
  }

  const errorCode = typeof errorPayload.errorCode === 'string' ? errorPayload.errorCode : undefined;
  const message = typeof errorPayload.detail === 'string'
    ? errorPayload.detail
    : (typeof errorPayload.title === 'string' ? errorPayload.title : 'Đã xảy ra lỗi khi kết nối máy chủ.');

  throw new TravelGroupHttpError(response.status, message, errorCode ?? 'server.error');
}

export async function fetchGroupMessages(
  groupId: number,
  limit = 50,
  beforeMessageId?: number,
): Promise<GroupMessageApiDto[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (beforeMessageId) params.append('beforeMessageId', String(beforeMessageId));
  return requestWithAuth<GroupMessageApiDto[]>(
    `${getApiBase()}/travel-groups/${groupId}/messages?${params.toString()}`,
    'GET',
  );
}

export async function postGroupMessage(
  groupId: number,
  payload: { messageType: string; content: string; metadataJson?: string },
): Promise<GroupMessageApiDto> {
  return requestWithAuth<GroupMessageApiDto>(
    `${getApiBase()}/travel-groups/${groupId}/messages`,
    'POST',
    payload,
  );
}

export async function acknowledgeBroadcastMessage(
  groupId: number,
  messageId: number,
): Promise<number> {
  return requestWithAuth<number>(
    `${getApiBase()}/travel-groups/${groupId}/messages/${messageId}/acknowledge`,
    'POST',
  );
}

export async function checkinRollCallMessage(
  groupId: number,
  messageId: number,
): Promise<number> {
  return requestWithAuth<number>(
    `${getApiBase()}/travel-groups/${groupId}/messages/${messageId}/checkin`,
    'POST',
  );
}

export async function toggleExpensePaymentStatus(
  groupId: number,
  messageId: number,
  isPaid: boolean,
): Promise<number[]> {
  return requestWithAuth<number[]>(
    `${getApiBase()}/travel-groups/${groupId}/messages/${messageId}/toggle-payment`,
    'POST',
    { isPaid },
  );
}

export async function votePollOption(
  groupId: number,
  messageId: number,
  optionIndex: number,
): Promise<Record<number, number>> {
  return requestWithAuth<Record<number, number>>(
    `${getApiBase()}/travel-groups/${groupId}/messages/${messageId}/vote`,
    'POST',
    { optionIndex },
  );
}
