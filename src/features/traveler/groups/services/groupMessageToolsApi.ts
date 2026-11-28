import { getApiBase } from '@/lib/apiBase';
import { chatRequest, isGroupMessage, TravelGroupHttpError, type GroupMessageApiDto } from './travelGroupApi';

export interface ImportantMessagesPage { items: GroupMessageApiDto[]; nextBeforeMessageId: number | null }
export interface PollVoter { userId: number; displayName: string; avatarUrl: string | null; optionIndex: number; votedAtUtc: string }
export interface EditGroupMessagePayload { content: string; metadataJson: string | null; expectedRevision: number; clientRequestId: string }
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
const base = (groupId: number) => `${getApiBase()}/travel-groups/${groupId}/messages`;
const invalid = () => new TravelGroupHttpError(502, 'Dữ liệu tiện ích nhóm không hợp lệ. Vui lòng tải lại.', 'server.invalid_contract');

export async function fetchImportantMessages(groupId: number, beforeMessageId?: number, signal?: AbortSignal): Promise<ImportantMessagesPage> {
  const params = new URLSearchParams({ limit: '20' });
  if (beforeMessageId !== undefined) params.set('beforeMessageId', String(beforeMessageId));
  const data = await chatRequest<ImportantMessagesPage>(`${base(groupId)}/important?${params}`, 'GET', undefined, signal);
  if (!data || !Array.isArray(data.items) || !data.items.every((m, i) => isGroupMessage(m) && m.groupId === groupId
    && ['poll', 'broadcast', 'roll_call'].includes(m.messageType) && (i === 0 || data.items[i - 1].messageId > m.messageId))
    || !(data.nextBeforeMessageId === null || positive(data.nextBeforeMessageId))
    || (data.nextBeforeMessageId !== null && (!data.items.length || data.nextBeforeMessageId !== data.items.at(-1)?.messageId))) throw invalid();
  if (beforeMessageId !== undefined && (!positive(beforeMessageId)
    || data.items.some(message => message.messageId >= beforeMessageId)
    || data.nextBeforeMessageId !== null && data.nextBeforeMessageId >= beforeMessageId)) throw invalid();
  return data;
}
export async function fetchPollVoters(groupId: number, messageId: number, signal?: AbortSignal): Promise<PollVoter[]> {
  const data = await chatRequest<unknown>(`${base(groupId)}/${messageId}/votes`, 'GET', undefined, signal);
  if (!Array.isArray(data) || !data.every(v => v && positive(v.userId) && typeof v.displayName === 'string'
    && (v.avatarUrl === null || typeof v.avatarUrl === 'string') && Number.isInteger(v.optionIndex) && v.optionIndex >= 0 && v.optionIndex <= 5
    && typeof v.votedAtUtc === 'string' && Number.isFinite(Date.parse(v.votedAtUtc))) || new Set(data.map(v => v.userId)).size !== data.length) throw invalid();
  return data;
}
export async function editGroupMessage(groupId: number, messageId: number, payload: EditGroupMessagePayload, messageType?: string): Promise<GroupMessageApiDto> {
  try {
    const data = await chatRequest<unknown>(`${base(groupId)}/${messageId}`, 'PUT', payload);
    if (!isGroupMessage(data) || data.groupId !== groupId || data.messageId !== messageId || !Number.isSafeInteger(data.revision) || Number(data.revision) < 0) throw invalid();
    return data;
  } catch (error) {
    if (error instanceof TravelGroupHttpError && error.status === 409) throw new TravelGroupHttpError(409,
      messageType === 'split_bill' ? 'Khoản chia tiền đã thay đổi hoặc đã có xác nhận chuyển tiền. Không thể chỉnh sửa; hãy đóng và mở lại để xem thông tin mới nhất.'
        : messageType === 'broadcast' ? 'Thông báo đã thay đổi hoặc đã có người xác nhận đã đọc. Không thể sửa; hãy tải lại. Bạn có thể gửi thông báo mới để đính chính.'
          : messageType === 'poll' ? 'Bình chọn đã thay đổi hoặc đã có phiếu. Giữ nguyên câu hỏi và các lựa chọn cũ; chỉ thêm lựa chọn mới. Hãy đóng và mở lại để tải bản mới nhất.'
            : 'Chưa thể sửa: nội dung đã thay đổi hoặc đã có người tương tác. Hãy tải lại.', error.code);
    throw error;
  }
}
