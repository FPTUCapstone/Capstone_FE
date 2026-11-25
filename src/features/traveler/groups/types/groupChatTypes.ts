export type ConversationType = 'tour' | 'self_guided' | 'direct';

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  avatar?: string;
  subtitle: string;
  unreadCount: number;
  updatedAt: string;
  memberCount: number;
  hostName?: string;
  tourCode?: string;
  itineraryId?: number;
  itineraryTitle?: string;
  pinnedAnnouncement?: string;
}

export type MessageType =
  | 'text'
  | 'broadcast'
  | 'roll_call'
  | 'split_bill'
  | 'poll'
  | 'meeting_point';

export interface BroadcastData {
  title: string;
  content: string;
  priority: 'high' | 'normal';
  acknowledgedUserIds: number[];
}

export interface RollCallData {
  title: string;
  totalMembers: number;
  checkedInUserIds: number[];
  deadlineTime?: string;
}

export interface SplitBillData {
  title: string;
  payerName: string;
  payerBankName: string;
  payerBankAccount: string;
  totalAmount: number;
  perPersonAmount: number;
  participantNames: string[];
  paidUserIds: number[];
}

export interface PollOption {
  id: string;
  text: string;
  voterUserIds: number[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  totalVotes: number;
}

export interface MeetingPointData {
  title: string;
  address: string;
  time: string;
  latitude?: number;
  longitude?: number;
}

export interface GroupChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  isSelf: boolean;
  isHost: boolean;
  timestamp: string;
  type: MessageType;
  content: string;
  broadcastData?: BroadcastData;
  rollCallData?: RollCallData;
  splitBillData?: SplitBillData;
  pollData?: PollData;
  meetingPointData?: MeetingPointData;
}
