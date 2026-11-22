import type { Metadata } from 'next';
import { GroupChatHub } from '@/features/traveler/groups/components/GroupChatHub';

export const metadata: Metadata = {
  title: 'Trò chuyện nhóm & Tin nhắn | TripMate',
  description:
    'Trung tâm liên lạc nhóm du lịch, thông báo đoàn từ Hướng dẫn viên, bình chọn và chia tiền chuyến đi tích hợp VietQR.',
};

export default function MessagesPage() {
  return <GroupChatHub />;
}
