import { getApiBase } from '@/lib/apiBase';
import { requestJson, messageForStatus } from '@/lib/jsonRequest';
import { isRecord } from '@/lib/typeGuards';

export interface ChatContext { kind: 'refund' | 'itinerary' | 'tour'; id: string }
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface ChatSource { id: string; title: string; url: string }
export interface ChatRequest { message: string; history: ChatMessage[]; context?: ChatContext }
export type ChatAction =
  | { type: 'navigate'; label: string; url: string; description?: string }
  | { type: 'selectContext'; label: string; context: ChatContext; prompt: string; description?: string };
export interface ChatResponse { answer: string; sources: ChatSource[]; context?: ChatContext; actions?: ChatAction[] }

export class SupportChatError extends Error {
  constructor(public readonly status: number) {
    super(messageForStatus(status, {
      400: 'Check your message and selected record, then try again.',
      401: 'Your session has expired. Sign in again to continue.',
      403: 'Your account cannot access this support context.',
      404: 'The selected record could not be found. Choose another record.',
      429: 'Too many requests. Please wait before retrying.',
      503: 'Support chat is temporarily unavailable. Please try again later.',
    }, 'Support chat could not respond. Please try again later.'));
    this.name = 'SupportChatError';
  }
}

export function isChatContext(value: unknown): value is ChatContext {
  return isRecord(value) && (value.kind === 'refund' || value.kind === 'itinerary' || value.kind === 'tour') &&
    typeof value.id === 'string' && /^[0-9]+$/.test(value.id) && /[1-9]/.test(value.id) &&
    BigInt(value.id) <= BigInt('9223372036854775807');
}

/** Allow a conservative subset of same-origin paths. Unsafe sources remain text. */
export function safeSourcePath(url: string): string | null {
  return /^\/(?!\/)[A-Za-z0-9/_-]*(?:\?[A-Za-z0-9_=&%.-]*)?(?:#[A-Za-z0-9_-]*)?$/.test(url) ? url : null;
}

/** Only existing resource destinations and booking handoff arguments are actionable. */
export function safeActionPath(url: string): string | null {
  if (['/tours', '/itineraries', '/partner/bookings', '/plan', '/pois', '/account/profile', '/account/preferences', '/account/security'].includes(url)) return url;
  const match = /^(\/tours\/([0-9]+)(\/book)?|\/itinerary\/([0-9]+)|\/bookings\/([0-9]+)\/(?:refund|ticket|pay)|\/account\/trips)(?:\?([A-Za-z0-9=&]+))?$/.exec(url);
  if (!match) return null;
  const resourceId = match[2] ?? match[4] ?? match[5];
  if (resourceId && !isChatContext({ kind: 'tour', id: resourceId })) return null;
  if (!match[6]) return url;
  if (!match[3]) return null;
  const params = new URLSearchParams(match[6]);
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length || keys.some(key => !['scheduleId', 'adults', 'children', 'infants'].includes(key))) return null;
  const scheduleId = params.get('scheduleId');
  if (scheduleId !== null && !isChatContext({ kind: 'tour', id: scheduleId })) return null;
  const adults = params.get('adults');
  if (adults !== null && (!/^[0-9]+$/.test(adults) || Number(adults) < 1 || Number(adults) > 50)) return null;
  let total = Number(adults ?? 0);
  for (const key of ['children', 'infants']) {
    const value = params.get(key);
    if (value !== null && (!/^[0-9]+$/.test(value) || Number(value) > 50 || adults === null)) return null;
    total += Number(value ?? 0);
  }
  if (total > 50) return null;
  return url;
}

function parseChatAction(value: unknown): ChatAction | null {
  if (!isRecord(value) || typeof value.label !== 'string' || !value.label.trim() ||
    (value.description != null && typeof value.description !== 'string') ||
    !Object.keys(value).every(key => ['type', 'label', 'url', 'context', 'prompt', 'description'].includes(key))) return null;
  const description = typeof value.description === 'string' ? { description: value.description } : {};
  if (value.type === 'navigate' && value.context == null && value.prompt == null &&
    typeof value.url === 'string' && safeActionPath(value.url) !== null) {
    return { type: 'navigate', label: value.label, url: value.url, ...description };
  }
  if (value.type === 'selectContext' && value.url == null && isChatContext(value.context) &&
    Object.keys(value.context).every(key => key === 'kind' || key === 'id') &&
    typeof value.prompt === 'string' && !!value.prompt.trim() && value.prompt.length <= 2000) {
    return { type: 'selectContext', label: value.label, context: value.context, prompt: value.prompt, ...description };
  }
  return null;
}

export async function sendSupportMessage(request: ChatRequest, accessToken: string, signal?: AbortSignal): Promise<ChatResponse> {
  if (!accessToken) throw new SupportChatError(401);
  if (typeof request.message !== 'string' || !request.message.trim() || request.message.length > 2000 ||
    !Array.isArray(request.history) || request.history.length > 10 ||
    request.history.some((message) => !isRecord(message) || !['user', 'assistant'].includes(message.role as string) ||
      typeof message.content !== 'string' || !message.content.trim() || message.content.length > 2000) ||
    (request.context !== undefined && !isChatContext(request.context))) throw new SupportChatError(400);

  const { status, body } = await requestJson(`${getApiBase()}/support-chat/messages`, {
    method: 'POST', accessToken, signal, jsonBody: request, cache: 'no-store',
    networkError: () => new SupportChatError(503),
  });
  if (status < 200 || status >= 300) throw new SupportChatError(status);
  if (!isRecord(body) || typeof body.answer !== 'string' || !body.answer.trim() || !Array.isArray(body.sources) ||
    body.sources.some((source) => !isRecord(source) || typeof source.id !== 'string' ||
      typeof source.title !== 'string' || typeof source.url !== 'string') ||
    (body.context != null && (!isChatContext(body.context) || body.context.kind !== request.context?.kind ||
      body.context.id !== request.context?.id))) throw new SupportChatError(503);
  if (body.actions != null && !Array.isArray(body.actions)) throw new SupportChatError(503);
  const actions = Array.isArray(body.actions) ? body.actions.map(parseChatAction) : undefined;
  if (actions?.some(action => action === null)) throw new SupportChatError(503);
  return {
    answer: body.answer,
    sources: body.sources as ChatSource[],
    ...(actions ? { actions: actions as ChatAction[] } : {}),
    ...(isChatContext(body.context) ? { context: body.context } : {}),
  };
}
