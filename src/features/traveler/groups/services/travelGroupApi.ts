/**
 * TripMate UC-18 / UC-19 — Travel Group Management Client
 * Connects to ASP.NET Core 8 backend endpoint POST /api/v1/travel-groups/join
 * with Idempotency-Key header and Bearer token.
 */

import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';
import { bodyRecord } from '@/lib/jsonRequest';
import { webRefresh } from '@/lib/authApi';

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
  clientMessageId?: string | null;
}

let renewal: ReturnType<typeof webRefresh> | null = null;

export async function chatRequest<T>(
  url: string,
  method: 'GET' | 'POST',
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const owner = AuthStorage.getContext();
  if (!owner) throw new TravelGroupHttpError(401, 'Vui lòng đăng nhập để trò chuyện.', 'auth.unauthorized');
  const send = (token: string) => fetch(url, {
    method, credentials: 'include', signal: signal ?? AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let response: Response;
  try {
    response = await send(owner.accessToken);
    if (response.status === 401) {
      renewal ??= webRefresh().finally(() => { renewal = null; });
      const fresh = await renewal;
      if (fresh.userId !== owner.userId) throw new TravelGroupHttpError(409, 'Tài khoản đã thay đổi. Vui lòng mở lại cuộc trò chuyện.', 'auth.changed');
      signal?.throwIfAborted();
      response = await send(fresh.accessToken);
    }
    if (AuthStorage.getContext()?.userId !== owner.userId) throw new TravelGroupHttpError(409, 'Phiên đăng nhập đã thay đổi.', 'auth.changed');
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof TravelGroupHttpError) throw error;
    if (error && typeof error === 'object' && 'status' in error && (error.status === 401 || error.status === 403)) {
      throw new TravelGroupHttpError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'auth.unauthorized');
    }
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
    const parsed: unknown = await response.json();
    errorPayload = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    // Non-json error
  }

  const errorCode = typeof errorPayload.errorCode === 'string' ? errorPayload.errorCode : undefined;
  const messages: Record<number, string> = {
    400: 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.',
    401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    403: 'Bạn không còn quyền truy cập cuộc trò chuyện này.',
    404: 'Cuộc trò chuyện hoặc tin nhắn không còn tồn tại.',
    409: 'Nhóm đã đóng hoặc thao tác xung đột. Vui lòng tải lại.',
    429: 'Bạn thao tác quá nhanh. Vui lòng đợi rồi thử lại.',
  };
  const message = errorCode === 'travel_group.group_closed' ? 'Nhóm đã đóng. Bạn chỉ có thể xem lịch sử.'
    : messages[response.status] ?? 'Dịch vụ trò chuyện tạm thời không khả dụng. Vui lòng thử lại.';

  throw new TravelGroupHttpError(response.status, message, errorCode ?? 'server.error');
}

export async function fetchGroupMessages(
  groupId: number,
  limit = 50,
  beforeMessageId?: number,
): Promise<GroupMessageApiDto[]> {
  requireId(groupId);
  const params = new URLSearchParams({ limit: String(limit) });
  if (beforeMessageId) params.append('beforeMessageId', String(beforeMessageId));
  const result = await chatRequest<unknown>(
    `${getApiBase()}/travel-groups/${groupId}/messages?${params.toString()}`,
    'GET',
  );
  if (!Array.isArray(result) || !result.every(d => isGroupMessage(d) && d.groupId === groupId)) throw invalidContract();
  return result;
}

export async function postGroupMessage(
  groupId: number,
  payload: { messageType: string; content: string; metadataJson?: string; clientMessageId?: string },
): Promise<GroupMessageApiDto> {
  requireId(groupId);
  const result = await chatRequest<unknown>(
    `${getApiBase()}/travel-groups/${groupId}/messages`,
    'POST',
    payload,
  );
  if (!isGroupMessage(result) || result.groupId !== groupId) throw invalidContract();
  return result;
}

export async function acknowledgeBroadcastMessage(
  groupId: number,
  messageId: number,
): Promise<number> {
  return chatRequest<number>(
    `${getApiBase()}/travel-groups/${groupId}/messages/${messageId}/acknowledge`,
    'POST',
  );
}

export async function checkinRollCallMessage(
  groupId: number,
  messageId: number,
): Promise<number> {
  return chatRequest<number>(
    `${getApiBase()}/travel-groups/${groupId}/messages/${messageId}/checkin`,
    'POST',
  );
}

export async function toggleExpensePaymentStatus(
  groupId: number,
  messageId: number,
  isPaid: boolean,
): Promise<number[]> {
  return chatRequest<number[]>(
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
  return chatRequest<Record<number, number>>(
    `${getApiBase()}/travel-groups/${groupId}/messages/${messageId}/vote`,
    'POST',
    { optionIndex },
  );
}

export interface GroupConversation {
  groupId: number; groupName: string; itineraryId: number; itineraryTitle: string | null;
  itinerarySourceType: string; hostUserId: number; memberCount: number; status: 'Active' | 'Closed';
  lastMessage: string | null; lastMessageAtUtc: string | null; unreadCount?: number;
}
export interface GroupConversationsPage { items: GroupConversation[]; nextBeforeGroupId: number | null }
const positiveId = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
function requireId(v: number) { if (!positiveId(v)) throw new TravelGroupHttpError(400, 'ID cuộc trò chuyện không hợp lệ.', 'validation.id'); }
const nullableString = (v: unknown) => v === null || typeof v === 'string';
function invalidContract() { return new TravelGroupHttpError(502, 'Dữ liệu trò chuyện từ máy chủ không hợp lệ. Vui lòng tải lại.', 'server.invalid_contract'); }
export function isGroupMessage(v: unknown): v is GroupMessageApiDto {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return positiveId(d.messageId) && positiveId(d.groupId) && positiveId(d.senderUserId)
    && typeof d.senderName === 'string' && typeof d.content === 'string'
    && ['text', 'broadcast', 'roll_call', 'split_bill', 'poll'].includes(String(d.messageType))
    && typeof d.createdAtUtc === 'string' && Number.isFinite(Date.parse(d.createdAtUtc))
    && typeof d.isReadByMe === 'boolean' && typeof d.isPresentByMe === 'boolean'
    && Number.isSafeInteger(d.readByCount) && Number(d.readByCount) >= 0
    && Number.isSafeInteger(d.presentCount) && Number(d.presentCount) >= 0
    && Array.isArray(d.paidUserIds) && d.paidUserIds.every(positiveId)
    && !!d.pollVoteCounts && typeof d.pollVoteCounts === 'object'
    && Object.entries(d.pollVoteCounts).every(([k, n]) => /^\d$/.test(k) && Number(k) <= 5 && Number.isSafeInteger(n) && Number(n) >= 0)
    && (d.myPollVoteOption === undefined || d.myPollVoteOption === null || (Number.isInteger(d.myPollVoteOption) && Number(d.myPollVoteOption) >= 0 && Number(d.myPollVoteOption) <= 5));
}
export async function fetchGroupConversations(beforeGroupId?: number, signal?: AbortSignal): Promise<GroupConversationsPage> {
  const p = new URLSearchParams({ limit: '50' });
  if (beforeGroupId !== undefined) p.set('beforeGroupId', String(beforeGroupId));
  const data = await chatRequest<GroupConversationsPage>(`${getApiBase()}/travel-groups/conversations?${p}`, 'GET', undefined, signal);
  if (!data || !Array.isArray(data.items) || !data.items.every(d => d && typeof d === 'object' && positiveId(d.groupId) && positiveId(d.itineraryId)
    && positiveId(d.hostUserId) && typeof d.groupName === 'string' && nullableString(d.itineraryTitle)
    && typeof d.itinerarySourceType === 'string' && Number.isSafeInteger(d.memberCount) && d.memberCount >= 0
    && ['Active', 'Closed'].includes(d.status) && nullableString(d.lastMessage) && nullableString(d.lastMessageAtUtc))
    || !(data.nextBeforeGroupId === null || positiveId(data.nextBeforeGroupId))) throw invalidContract();
  return data;
}
export interface ChatMember { memberId: number; displayName: string; isHost: boolean }
export async function fetchChatMembers(groupId: number): Promise<ChatMember[]> {
  const data = await chatRequest<{ groupId: number; members: ChatMember[] }>(`${getApiBase()}/travel-groups/${groupId}/members`, 'GET');
  if (!data || data.groupId !== groupId || !Array.isArray(data.members) || !data.members.every(m => m && positiveId(m.memberId) && typeof m.displayName === 'string' && typeof m.isHost === 'boolean')) throw invalidContract();
  return data.members;
}
export async function markGroupRead(groupId: number, throughMessageId: number): Promise<void> {
  await chatRequest(`${getApiBase()}/travel-groups/${groupId}/messages/read`, 'POST', { throughMessageId });
}
