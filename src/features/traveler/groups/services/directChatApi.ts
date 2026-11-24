import { getApiBase } from '@/lib/apiBase';
import { chatRequest, TravelGroupHttpError } from './travelGroupApi';

export interface ChatUser { userId: number; displayName: string; avatarUrl: string | null }
export interface DirectConversation {
  conversationId: number; otherUserId: number; displayName: string; avatarUrl: string | null;
  lastMessage: string | null; lastMessageAtUtc: string | null; unreadCount: number;
}
export interface DirectMessage {
  messageId: number; conversationId: number; senderUserId: number; senderName: string;
  content: string; createdAtUtc: string; clientMessageId: string; isReadByOther: boolean;
}
export interface DirectPage { items: DirectConversation[]; nextBeforeConversationId: number | null }
const id = (v: unknown) => Number.isSafeInteger(v) && Number(v) > 0;
const nullable = (v: unknown) => v === null || typeof v === 'string';
const failure = () => new TravelGroupHttpError(502, 'Dữ liệu trò chuyện từ máy chủ không hợp lệ.', 'server.invalid_contract');
const base = () => `${getApiBase()}/direct-conversations`;
function conversation(v: unknown): v is DirectConversation {
  if (!v || typeof v !== 'object') return false;
  const x = v as DirectConversation;
  return id(x.conversationId) && id(x.otherUserId) && typeof x.displayName === 'string'
    && nullable(x.avatarUrl) && nullable(x.lastMessage) && nullable(x.lastMessageAtUtc)
    && Number.isSafeInteger(x.unreadCount) && x.unreadCount >= 0;
}
function message(v: unknown): v is DirectMessage {
  if (!v || typeof v !== 'object') return false;
  const x = v as DirectMessage;
  return id(x.messageId) && id(x.conversationId) && id(x.senderUserId) && typeof x.senderName === 'string'
    && typeof x.content === 'string' && typeof x.clientMessageId === 'string'
    && typeof x.isReadByOther === 'boolean'
    && typeof x.createdAtUtc === 'string' && Number.isFinite(Date.parse(x.createdAtUtc));
}
export async function searchChatUsers(search: string, signal?: AbortSignal): Promise<ChatUser[]> {
  if (search.trim().length < 2) return [];
  const data = await chatRequest<ChatUser[]>(`${base()}/users?${new URLSearchParams({ search: search.trim(), limit: '20' })}`, 'GET', undefined, signal);
  if (!Array.isArray(data) || !data.every(u => u && typeof u === 'object' && id(u.userId) && typeof u.displayName === 'string' && nullable(u.avatarUrl))) throw failure();
  return data;
}
export async function openDirectConversation(otherUserId: number): Promise<DirectConversation> {
  const data = await chatRequest<unknown>(base(), 'POST', { otherUserId });
  if (!conversation(data)) throw failure();
  return data;
}
export async function fetchDirectConversations(beforeConversationId?: number): Promise<DirectPage> {
  const p = new URLSearchParams({ limit: '50' });
  if (beforeConversationId) p.set('beforeConversationId', String(beforeConversationId));
  const data = await chatRequest<DirectPage>(`${base()}?${p}`, 'GET');
  if (!data || !Array.isArray(data.items) || !data.items.every(conversation)
    || !(data.nextBeforeConversationId === null || id(data.nextBeforeConversationId))) throw failure();
  return data;
}
export async function fetchDirectMessages(conversationId: number, beforeMessageId?: number): Promise<DirectMessage[]> {
  const p = new URLSearchParams({ limit: '50' });
  if (beforeMessageId) p.set('beforeMessageId', String(beforeMessageId));
  const data = await chatRequest<unknown>(`${base()}/${conversationId}/messages?${p}`, 'GET');
  if (!Array.isArray(data) || !data.every(m => message(m) && m.conversationId === conversationId)) throw failure();
  return data;
}
export async function sendDirectMessage(conversationId: number, content: string, clientMessageId: string): Promise<DirectMessage> {
  const data = await chatRequest<unknown>(`${base()}/${conversationId}/messages`, 'POST', { content, clientMessageId });
  if (!message(data) || data.conversationId !== conversationId) throw failure();
  return data;
}
export async function markDirectRead(conversationId: number, throughMessageId: number): Promise<void> {
  await chatRequest(`${base()}/${conversationId}/read`, 'POST', { throughMessageId });
}
