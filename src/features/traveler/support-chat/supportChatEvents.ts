import { AuthStorage } from '@/features/auth/session/authSession';
import { isChatContext, type ChatContext } from './services/supportChatService';

export const SUPPORT_CHAT_OPEN_EVENT = 'tripmate:support-chat-open';
export interface SupportChatOpenDetail { context: ChatContext; userId: number }

/** Open support for a resource the signed-in user has explicitly selected. */
export function openSupportChat(context: ChatContext): void {
  const session = AuthStorage.getContext();
  if (typeof window === 'undefined' || !session || !isChatContext(context) ||
    !['Traveler', 'TourOperator'].includes(session.role) ||
    (session.role === 'TourOperator' && context.kind === 'itinerary')) return;
  window.dispatchEvent(new CustomEvent<SupportChatOpenDetail>(SUPPORT_CHAT_OPEN_EVENT, {
    detail: { context, userId: session.userId },
  }));
}
