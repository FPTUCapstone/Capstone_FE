import { AuthStorage } from '@/features/auth/session/authSession';
import { getApiBase } from '@/lib/apiBase';
import { chatRequest, TravelGroupHttpError } from './travelGroupApi';

export interface LeaveTravelGroupResponse {
  groupId: number;
  membershipStatus: 'Left';
  groupClosed: boolean;
  newHostUserId: number | null;
  leftAtUtc: string;
}

export interface LeaveChatGroupResponse {
  groupId: number;
  membershipStatus: 'Left';
  newHostUserId: number;
  leftAtUtc: string;
}

type GroupKind = 'travel' | 'chat';
interface LeaveOperation { actorId: number; kind: GroupKind; groupId: number; replacementHostUserId: number | null; idempotencyKey: string }
// Retain every payload's key across dialog remounts; changing selection starts a distinct operation.
const retryKeys = new Map<string, LeaveOperation>();
function fingerprint(actorId: number, kind: GroupKind, groupId: number, replacementHostUserId: number | null) {
  return JSON.stringify([actorId, kind, groupId, kind === 'chat' ? { replacementHostUserId } : null]);
}
export function hasPendingGroupLeave(groupId: number, kind: GroupKind = 'travel', replacementHostUserId: number | null = null): boolean {
  const owner = AuthStorage.getContext();
  return !!owner && retryKeys.has(fingerprint(owner.userId, kind, groupId, replacementHostUserId));
}

export function getPendingChatGroupLeave(groupId: number): { replacementHostUserId: number | null } | null {
  const owner = AuthStorage.getContext();
  const operation = Array.from(retryKeys.values()).reverse().find(item =>
    item.actorId === owner?.userId && item.kind === 'chat' && item.groupId === groupId);
  return operation ? { replacementHostUserId: operation.replacementHostUserId } : null;
}

const leaveErrors: Record<string, string> = {
  'travel_group.group_closed': 'Nhóm đã đóng nên không thể rời nhóm.',
  'travel_group.group_not_found': 'Nhóm du lịch không còn tồn tại.',
  'travel_group.active_membership_required': 'Bạn phải là thành viên đang hoạt động để rời nhóm.',
  'travel_group.already_left': 'Bạn đã rời nhóm du lịch này. Vui lòng tải lại danh sách trò chuyện.',
  'travel_group.member_list_inconsistent': 'Dữ liệu thành viên nhóm không nhất quán. Vui lòng tải lại hoặc thử lại sau.',
  'travel_group.concurrent_retry_exhausted': 'Nhóm đang bận. Vui lòng thử lại; mã yêu cầu rời nhóm được giữ nguyên.',
  'travel_group.idempotency_key_payload_mismatch': 'Mã yêu cầu đã được dùng cho nhóm khác. Không thể hoàn tất yêu cầu rời nhóm này.',
};

function validResponse(value: unknown, groupId: number): value is LeaveTravelGroupResponse {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return data.groupId === groupId && data.membershipStatus === 'Left'
    && typeof data.groupClosed === 'boolean'
    && (data.newHostUserId === null || (Number.isSafeInteger(data.newHostUserId) && Number(data.newHostUserId) > 0))
    && (!data.groupClosed || data.newHostUserId === null)
    && typeof data.leftAtUtc === 'string' && Number.isFinite(Date.parse(data.leftAtUtc));
}

function validChatResponse(value: unknown, groupId: number): value is LeaveChatGroupResponse {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return data.groupId === groupId && data.membershipStatus === 'Left'
    && Number.isSafeInteger(data.newHostUserId) && Number(data.newHostUserId) > 0
    && typeof data.leftAtUtc === 'string' && Number.isFinite(Date.parse(data.leftAtUtc));
}

export function leaveTravelGroup(groupId: number): Promise<LeaveTravelGroupResponse> {
  return leaveGroup(groupId, 'travel', null) as Promise<LeaveTravelGroupResponse>;
}

export function leaveChatGroup(groupId: number, replacementHostUserId: number | null): Promise<LeaveChatGroupResponse> {
  return leaveGroup(groupId, 'chat', replacementHostUserId) as Promise<LeaveChatGroupResponse>;
}

async function leaveGroup(groupId: number, kind: GroupKind, replacementHostUserId: number | null): Promise<LeaveTravelGroupResponse | LeaveChatGroupResponse> {
  const owner = AuthStorage.getContext();
  if (!owner) throw new TravelGroupHttpError(401, 'Vui lòng đăng nhập để rời nhóm.', 'auth.unauthorized');
  if (owner.status !== 'Active' || (kind === 'travel' && owner.role !== 'Traveler')) {
    throw new TravelGroupHttpError(403, 'Tài khoản không có quyền rời nhóm này.', 'auth.forbidden');
  }
  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    throw new TravelGroupHttpError(400, 'ID nhóm không hợp lệ.', 'validation.id');
  }
  if (replacementHostUserId !== null && (!Number.isSafeInteger(replacementHostUserId)
    || replacementHostUserId <= 0 || replacementHostUserId === owner.userId)) {
    throw new TravelGroupHttpError(400, 'Vui lòng chọn thành viên khác làm trưởng nhóm.', 'validation.replacement');
  }
  const cacheKey = fingerprint(owner.userId, kind, groupId, replacementHostUserId);
  const operation = retryKeys.get(cacheKey) ?? { actorId: owner.userId, kind, groupId, replacementHostUserId, idempotencyKey: crypto.randomUUID() };
  retryKeys.delete(cacheKey);
  retryKeys.set(cacheKey, operation);
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // A fetch signal alone does not bound chatRequest's shared auth refresh wait.
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        abort.abort();
        reject(new TravelGroupHttpError(504,
          'Chưa xác nhận được kết quả rời nhóm. Vui lòng thử lại; mã yêu cầu được giữ nguyên.', 'network.timeout'));
      }, 20000);
    });
    const response = await Promise.race([
      chatRequest<unknown>(`${getApiBase()}/${kind === 'travel' ? 'travel-groups' : 'chat-groups'}/${groupId}/leave`, 'POST',
        kind === 'chat' ? { replacementHostUserId } : undefined,
        abort.signal, { 'Idempotency-Key': operation.idempotencyKey }),
      deadline,
    ]);
    if (!(kind === 'travel' ? validResponse(response, groupId) : validChatResponse(response, groupId))) {
      throw new TravelGroupHttpError(502, 'Phản hồi rời nhóm không hợp lệ. Vui lòng thử lại với mã yêu cầu đã giữ.', 'server.invalid_contract');
    }
    if (AuthStorage.getContext()?.userId !== owner.userId) {
      throw new TravelGroupHttpError(409, 'Tài khoản đã thay đổi. Vui lòng mở lại cuộc trò chuyện.', 'auth.changed');
    }
    for (const [savedKey, saved] of retryKeys) {
      if (saved.actorId === owner.userId && saved.kind === kind && saved.groupId === groupId) retryKeys.delete(savedKey);
    }
    return response as LeaveTravelGroupResponse | LeaveChatGroupResponse;
  } catch (error) {
    if (error instanceof TravelGroupHttpError && error.code && leaveErrors[error.code]) {
      throw new TravelGroupHttpError(error.status, leaveErrors[error.code], error.code);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
