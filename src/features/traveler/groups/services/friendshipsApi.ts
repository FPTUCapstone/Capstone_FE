import { getApiBase } from '@/lib/apiBase';
import { chatRequest, TravelGroupHttpError } from './travelGroupApi';

export interface Friendship {
  userId: number;
  displayName: string;
  avatarUrl: string | null;
  status: 'Pending' | 'Accepted';
  requestedByUserId: number;
}
export type FriendshipAction = 'request' | 'accept' | 'decline' | 'cancel' | 'remove';
export async function fetchFriendships(signal?: AbortSignal): Promise<Friendship[]> {
  const rows = await chatRequest<unknown>(`${getApiBase()}/friendships`, 'GET', undefined, signal);
  if (!Array.isArray(rows) || !rows.every((x: Friendship) => Number.isSafeInteger(x?.userId) && x.userId > 0 && typeof x.displayName === 'string' && (x.avatarUrl === null || typeof x.avatarUrl === 'string') && ['Pending', 'Accepted'].includes(x.status) && Number.isSafeInteger(x.requestedByUserId))) {
    throw new TravelGroupHttpError(502, 'Không thể đọc danh sách bạn bè. Vui lòng thử lại.');
  }
  return rows;
}
export async function changeFriendship(userId: number, action: FriendshipAction, signal?: AbortSignal): Promise<void> {
  try {
    await chatRequest(`${getApiBase()}/friendships/${userId}`, 'PUT', { action }, signal);
  } catch (error) {
    if (error instanceof TravelGroupHttpError && [403, 404, 409].includes(error.status)) {
      throw new TravelGroupHttpError(error.status, 'Lời mời hoặc trạng thái bạn bè đã thay đổi. Tải lại danh sách rồi thử lại.');
    }
    throw error;
  }
}
