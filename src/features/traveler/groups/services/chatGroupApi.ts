import { getApiBase } from '@/lib/apiBase';
import { chatRequest, TravelGroupHttpError, type GroupMessageApiDto } from './travelGroupApi';

export interface ChatGroupConversation {
  groupId: number; groupName: string; memberCount: number; hostUserId: number;
  lastMessage: string | null; lastMessageAtUtc: string | null; unreadCount: number; isClosed?: boolean;
}
export interface ChatGroupPage { items: ChatGroupConversation[]; nextBeforeGroupId: number | null }
export interface ChatGroupMessage {
  messageId: number; groupId: number; senderUserId: number; senderName: string;
  content: string; createdAtUtc: string; clientMessageId: string;
}
const base = () => `${getApiBase()}/chat-groups`;
const id = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
const count = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
const timestamp = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
const failure = () => new TravelGroupHttpError(502, 'Dữ liệu trò chuyện từ máy chủ không hợp lệ.', 'server.invalid_contract');
function conversation(v: unknown): v is ChatGroupConversation {
  if (!v || typeof v !== 'object') return false;
  const x = v as ChatGroupConversation;
  return id(x.groupId) && id(x.hostUserId) && typeof x.groupName === 'string' && count(x.memberCount) && count(x.unreadCount)
    && (x.isClosed === undefined || typeof x.isClosed === 'boolean')
    && (x.lastMessage === null || typeof x.lastMessage === 'string') && (x.lastMessageAtUtc === null || timestamp(x.lastMessageAtUtc));
}
function message(v: unknown): v is ChatGroupMessage {
  if (!v || typeof v !== 'object') return false;
  const x = v as ChatGroupMessage;
  return id(x.messageId) && id(x.groupId) && id(x.senderUserId) && typeof x.senderName === 'string'
    && typeof x.content === 'string' && typeof x.clientMessageId === 'string' && timestamp(x.createdAtUtc);
}
// UI adapter only: independent messages have no travel-tool interactions or receipts.
const textMessage = (row: ChatGroupMessage): GroupMessageApiDto => ({
  ...row, messageType: 'text', readByCount: 0, isReadByMe: false, presentCount: 0,
  isPresentByMe: false, paidUserIds: [], pollVoteCounts: {}, myPollVoteOption: null,
});
export async function createChatGroup(name: string, memberUserIds: number[], clientRequestId: string, signal?: AbortSignal): Promise<ChatGroupConversation> {
  const data = await chatRequest<unknown>(base(), 'POST', { name, memberUserIds, clientRequestId }, signal);
  if (!conversation(data)) throw failure();
  return data;
}
export async function fetchChatGroupConversations(beforeGroupId?: number): Promise<ChatGroupPage> {
  const params = new URLSearchParams({ limit: '50' });
  if (beforeGroupId !== undefined) params.set('beforeGroupId', String(beforeGroupId));
  const data = await chatRequest<ChatGroupPage>(`${base()}?${params}`, 'GET');
  if (!data || !Array.isArray(data.items) || !data.items.every(conversation)
    || !(data.nextBeforeGroupId === null || id(data.nextBeforeGroupId))) throw failure();
  return data;
}
export async function fetchChatGroupMessages(groupId: number, beforeMessageId?: number): Promise<GroupMessageApiDto[]> {
  const params = new URLSearchParams({ limit: '50' });
  if (beforeMessageId !== undefined) params.set('beforeMessageId', String(beforeMessageId));
  const data = await chatRequest<unknown>(`${base()}/${groupId}/messages?${params}`, 'GET');
  if (!Array.isArray(data) || !data.every((m, i) => message(m) && m.groupId === groupId
    && (i === 0 || data[i - 1].messageId < m.messageId))) throw failure();
  return (data as ChatGroupMessage[]).map(textMessage);
}
export async function sendChatGroupMessage(groupId: number, content: string, clientMessageId: string): Promise<GroupMessageApiDto> {
  const data = await chatRequest<unknown>(`${base()}/${groupId}/messages`, 'POST', { content, clientMessageId });
  if (!message(data) || data.groupId !== groupId) throw failure();
  return textMessage(data);
}
export async function markChatGroupRead(groupId: number, throughMessageId: number): Promise<void> {
  await chatRequest(`${base()}/${groupId}/read`, 'POST', { throughMessageId });
}
