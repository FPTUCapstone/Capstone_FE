import { getApiBase } from '@/lib/apiBase';
import { chatRequest, TravelGroupHttpError, type ChatMember } from './travelGroupApi';

interface Member { userId: number; displayName: string; avatarUrl: string | null; isHost: boolean; canReceiveHost?: boolean }
interface MembersResponse { groupId: number; groupName: string; memberCount: number; members: Member[] }
export async function fetchChatGroupMembers(groupId: number, signal?: AbortSignal): Promise<ChatMember[]> {
  const data = await chatRequest<MembersResponse>(`${getApiBase()}/chat-groups/${groupId}/members`, 'GET', undefined, signal);
  if (!data || data.groupId !== groupId || typeof data.groupName !== 'string'
    || !Number.isSafeInteger(data.memberCount) || !Array.isArray(data.members) || data.memberCount !== data.members.length
    || !data.members.every(member => member && Number.isSafeInteger(member.userId) && member.userId > 0
      && typeof member.displayName === 'string' && typeof member.isHost === 'boolean'
      && (member.canReceiveHost === undefined || typeof member.canReceiveHost === 'boolean')
      && (member.avatarUrl === null || typeof member.avatarUrl === 'string'))
    || new Set(data.members.map(member => member.userId)).size !== data.members.length) {
    throw new TravelGroupHttpError(502, 'Không thể đọc danh sách thành viên. Vui lòng thử lại.', 'server.invalid_contract');
  }
  return data.members.map(member => ({ memberId: member.userId, displayName: member.displayName, isHost: member.isHost,
    canReceiveHost: member.canReceiveHost === true }));
}
