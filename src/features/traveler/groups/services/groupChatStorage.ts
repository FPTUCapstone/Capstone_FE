import {
  Conversation,
  GroupChatMessage,
  BroadcastData,
  RollCallData,
  SplitBillData,
  PollData,
  MeetingPointData,
} from '../types/groupChatTypes';

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-tour-101',
    type: 'tour',
    title: 'Tour Khám phá Đà Nẵng - Hội An (3N2Đ)',
    subtitle: 'HDV Trần Văn Nam: Tập trung khởi hành tại Cổng 1 lúc 05:30...',
    unreadCount: 2,
    updatedAt: '10 phút trước',
    memberCount: 24,
    hostName: 'Trần Văn Nam (HDV)',
    tourCode: 'TOUR-DNH-2026',
    pinnedAnnouncement: '📢 Tập trung khởi hành lúc 05:30 sáng tại Cổng số 1 Bến xe Trung tâm.',
  },
  {
    id: 'conv-friends-202',
    type: 'self_guided',
    title: 'Hội Bạn Thân Vi Vu Đà Lạt 🌲',
    subtitle: 'Nguyễn Hoàng Long vừa chia tiền: Lẩu gà lá é 600.000đ',
    unreadCount: 1,
    updatedAt: '25 phút trước',
    memberCount: 4,
    hostName: 'Nguyễn Hoàng Long',
    itineraryId: 101,
    itineraryTitle: 'Đà Lạt 3 ngày 2 đêm cùng bạn thân',
    pinnedAnnouncement: '📍 Điểm đến tiếp theo: Quảng trường Lâm Viên check-in lúc 16:00',
  },
  {
    id: 'conv-direct-303',
    type: 'direct',
    title: 'HDV Trần Văn Nam',
    subtitle: 'Dạ được bạn nhé, xe đón tận sảnh khách sạn lúc 05:45.',
    unreadCount: 0,
    updatedAt: 'Hôm qua',
    memberCount: 2,
    hostName: 'Trần Văn Nam',
  },
  {
    id: 'conv-direct-304',
    type: 'direct',
    title: 'Lê Thị Bích (Thành viên đoàn)',
    subtitle: 'Bạn ơi tối nay có đi dạo phố cổ cùng nhóm không?',
    unreadCount: 0,
    updatedAt: '2 ngày trước',
    memberCount: 2,
    hostName: 'Lê Thị Bích',
  },
];

const INITIAL_MESSAGES: Record<string, GroupChatMessage[]> = {
  'conv-tour-101': [
    {
      id: 'm-1',
      conversationId: 'conv-tour-101',
      senderId: 99,
      senderName: 'Trần Văn Nam (HDV)',
      isSelf: false,
      isHost: true,
      timestamp: '07:30',
      type: 'text',
      content: 'Chào mừng cả đoàn đến với Tour Đà Nẵng - Hội An 3N2Đ cùng TripMate! Em là Nam, HDV đồng hành cùng mọi người trong suốt chuyến đi.',
    },
    {
      id: 'm-2',
      conversationId: 'conv-tour-101',
      senderId: 99,
      senderName: 'Trần Văn Nam (HDV)',
      isSelf: false,
      isHost: true,
      timestamp: '07:32',
      type: 'broadcast',
      content: 'Thông báo khẩn về lịch trình ngày 1',
      broadcastData: {
        title: 'LỊCH KHỞI HÀNH NGÀY 1 & GIẤY TỜ TÙY THÂN',
        content: 'Xe đón đoàn lúc 05:30 sáng mai tại Cổng 1 Bến xe Đà Nẵng. Quý khách vui lòng mang theo CCCD/Hộ chiếu gốc để làm thủ tục check-in khách sạn và qua cổng danh thắng.',
        priority: 'high',
        acknowledgedUserIds: [1, 2, 3, 5, 8],
      },
    },
    {
      id: 'm-3',
      conversationId: 'conv-tour-101',
      senderId: 1,
      senderName: 'Bạn (Traveler)',
      isSelf: true,
      isHost: false,
      timestamp: '07:45',
      type: 'text',
      content: 'Dạ em đã chuẩn bị đầy đủ giấy tờ rồi ạ.',
    },
    {
      id: 'm-4',
      conversationId: 'conv-tour-101',
      senderId: 99,
      senderName: 'Trần Văn Nam (HDV)',
      isSelf: false,
      isHost: true,
      timestamp: '08:00',
      type: 'roll_call',
      content: 'Điểm danh khởi hành chặng Đà Nẵng',
      rollCallData: {
        title: 'ĐIỂM DANH LÊN XE KHỞI HÀNH',
        totalMembers: 24,
        checkedInUserIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        deadlineTime: '05:45 Sáng',
      },
    },
    {
      id: 'm-5',
      conversationId: 'conv-tour-101',
      senderId: 99,
      senderName: 'Trần Văn Nam (HDV)',
      isSelf: false,
      isHost: true,
      timestamp: '08:15',
      type: 'meeting_point',
      content: 'Điểm tập kết tại Hội An',
      meetingPointData: {
        title: 'Điểm hẹn tập kết trước Cổng Chùa Cầu',
        address: 'Đường Nguyễn Thị Minh Khai, Phường Cẩm Phô, Hội An',
        time: '19:30 Tối nay',
      },
    },
  ],
  'conv-friends-202': [
    {
      id: 'f-1',
      conversationId: 'conv-friends-202',
      senderId: 10,
      senderName: 'Nguyễn Hoàng Long',
      isSelf: false,
      isHost: true,
      timestamp: '11:00',
      type: 'text',
      content: 'Đã lên tới Đà Lạt rồi nha các bạn ơi! Không khí se lạnh thích quá 🌁',
    },
    {
      id: 'f-2',
      conversationId: 'conv-friends-202',
      senderId: 10,
      senderName: 'Nguyễn Hoàng Long',
      isSelf: false,
      isHost: true,
      timestamp: '11:05',
      type: 'poll',
      content: 'Bình chọn bữa tối',
      pollData: {
        question: 'Tối nay nhóm mình ăn món gì ở Đà Lạt?',
        options: [
          { id: 'opt-1', text: 'Lẩu gà lá é Tao Ngộ 🍲', voterUserIds: [1, 10, 12] },
          { id: 'opt-2', text: 'Bò tơ nướng ngói Cu Đức 🥩', voterUserIds: [11] },
          { id: 'opt-3', text: 'Bánh ướt lòng gà Tăng Bạt Hổ 🥣', voterUserIds: [] },
        ],
        totalVotes: 4,
      },
    },
    {
      id: 'f-3',
      conversationId: 'conv-friends-202',
      senderId: 10,
      senderName: 'Nguyễn Hoàng Long',
      isSelf: false,
      isHost: true,
      timestamp: '13:30',
      type: 'split_bill',
      content: 'Chia tiền ăn trưa',
      splitBillData: {
        title: 'Bữa trưa Lẩu gà lá é Tao Ngộ số 5',
        payerName: 'Nguyễn Hoàng Long',
        payerBankName: 'Vietcombank',
        payerBankAccount: '1018899889',
        totalAmount: 600000,
        perPersonAmount: 150000,
        participantNames: ['Long', 'Bạn', 'Hùng', 'Trang'],
        paidUserIds: [10],
      },
    },
  ],
  'conv-direct-303': [
    {
      id: 'd-1',
      conversationId: 'conv-direct-303',
      senderId: 1,
      senderName: 'Bạn (Traveler)',
      isSelf: true,
      isHost: false,
      timestamp: '14:20',
      type: 'text',
      content: 'Chào anh Nam, sáng mai xe có đón tại khách sạn Mường Thanh sông Hàn không ạ?',
    },
    {
      id: 'd-2',
      conversationId: 'conv-direct-303',
      senderId: 99,
      senderName: 'HDV Trần Văn Nam',
      isSelf: false,
      isHost: true,
      timestamp: '14:22',
      type: 'text',
      content: 'Dạ được bạn nhé! Xe đón tận sảnh khách sạn lúc 05:45. Bạn nhớ xuống sảnh trước 5 phút giúp em nha.',
    },
  ],
  'conv-direct-304': [
    {
      id: 'db-1',
      conversationId: 'conv-direct-304',
      senderId: 20,
      senderName: 'Lê Thị Bích',
      isSelf: false,
      isHost: false,
      timestamp: '09:00',
      type: 'text',
      content: 'Bạn ơi tối nay bạn có đi dạo phố cổ cùng nhóm không?',
    },
  ],
};

class GroupChatStorage {
  private conversations: Conversation[] = [...INITIAL_CONVERSATIONS];
  private messages: Record<string, GroupChatMessage[]> = { ...INITIAL_MESSAGES };

  getConversations(filterType?: string, keyword?: string): Conversation[] {
    let result = [...this.conversations];
    if (filterType && filterType !== 'all') {
      result = result.filter((c) => c.type === filterType);
    }
    if (keyword && keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          (c.hostName && c.hostName.toLowerCase().includes(q)),
      );
    }
    return result;
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.find((c) => c.id === id);
  }

  getMessages(conversationId: string, searchKeyword?: string): GroupChatMessage[] {
    const list = this.messages[conversationId] || [];
    if (!searchKeyword || !searchKeyword.trim()) {
      return [...list];
    }
    const q = searchKeyword.trim().toLowerCase();
    return list.filter((m) => m.content.toLowerCase().includes(q));
  }

  sendMessage(
    conversationId: string,
    message: Omit<GroupChatMessage, 'id' | 'conversationId' | 'timestamp'>,
  ): GroupChatMessage {
    const newMsg: GroupChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    this.messages[conversationId].push(newMsg);

    // Update conversation subtitle and timestamp
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.subtitle = `${message.senderName}: ${message.content}`;
      conv.updatedAt = 'Vừa xong';
    }

    return newMsg;
  }

  toggleAcknowledgeBroadcast(conversationId: string, messageId: string, userId: number): boolean {
    const msg = this.messages[conversationId]?.find((m) => m.id === messageId);
    if (!msg || !msg.broadcastData) return false;

    const list = msg.broadcastData.acknowledgedUserIds;
    const index = list.indexOf(userId);
    if (index >= 0) {
      list.splice(index, 1);
      return false;
    } else {
      list.push(userId);
      return true;
    }
  }

  toggleRollCall(conversationId: string, messageId: string, userId: number): boolean {
    const msg = this.messages[conversationId]?.find((m) => m.id === messageId);
    if (!msg || !msg.rollCallData) return false;

    const list = msg.rollCallData.checkedInUserIds;
    const index = list.indexOf(userId);
    if (index >= 0) {
      list.splice(index, 1);
      return false;
    } else {
      list.push(userId);
      return true;
    }
  }

  toggleVotePoll(conversationId: string, messageId: string, optionId: string, userId: number): void {
    const msg = this.messages[conversationId]?.find((m) => m.id === messageId);
    if (!msg || !msg.pollData) return;

    // In a single-choice poll, remove user's vote from other options
    for (const opt of msg.pollData.options) {
      const idx = opt.voterUserIds.indexOf(userId);
      if (opt.id === optionId) {
        if (idx >= 0) {
          opt.voterUserIds.splice(idx, 1);
        } else {
          opt.voterUserIds.push(userId);
        }
      } else if (idx >= 0) {
        opt.voterUserIds.splice(idx, 1);
      }
    }

    // Recompute total votes
    msg.pollData.totalVotes = msg.pollData.options.reduce(
      (sum, opt) => sum + opt.voterUserIds.length,
      0,
    );
  }

  markPaidExpense(conversationId: string, messageId: string, userId: number): boolean {
    const msg = this.messages[conversationId]?.find((m) => m.id === messageId);
    if (!msg || !msg.splitBillData) return false;

    const list = msg.splitBillData.paidUserIds;
    const index = list.indexOf(userId);
    if (index >= 0) {
      list.splice(index, 1);
      return false;
    } else {
      list.push(userId);
      return true;
    }
  }
}

export const chatStorage = new GroupChatStorage();
