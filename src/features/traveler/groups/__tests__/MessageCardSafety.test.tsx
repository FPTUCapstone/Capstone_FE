import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MessageCard } from '../components/MessageCard';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
import type { Thread } from '../components/useMessenger';
afterEach(cleanup);
it.each([null, 4, 'invalid', {}, { userId: 42 }])('does not crash or offer a payment for malformed participants: %j', participant => {
  const message = { messageId: 1, groupId: 73, senderUserId: 42, senderName: 'Member', content: 'Expense', messageType: 'split_bill', metadataJson: JSON.stringify({ participants: [participant], totalAmount: 100 }), createdAtUtc: '2026-11-24T00:00:00Z', paidUserIds: [] } as unknown as GroupMessageApiDto;
  const thread = { key: 'group:73', id: 73, kind: 'group', title: 'Group', preview: null, unread: 0, updatedAt: null } satisfies Thread;
  render(<MessageCard message={message} thread={thread} userId={42} busy={false} onInteract={vi.fn()} onQr={vi.fn()} />);
  expect(screen.getByText(/Không có phần chia hợp lệ/)).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Quét VietQR chuyển tiền' })).toBeNull();
});
