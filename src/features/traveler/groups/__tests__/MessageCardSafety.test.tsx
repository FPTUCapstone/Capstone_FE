import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MessageCard } from '../components/MessageCard';
import type { GroupMessageApiDto } from '../services/travelGroupApi';
import type { Thread } from '../components/useMessenger';
afterEach(cleanup);
it('offers creator editing and a voter list without exposing editing to other members', () => {
  const message = { messageId: 1, groupId: 73, senderUserId: 42, senderName: 'Host', content: 'Đi đâu?', messageType: 'poll', metadataJson: JSON.stringify({ question: 'Đi đâu?', options: [{ text: 'Biển' }, { text: 'Núi' }] }), createdAtUtc: '2026-11-24T00:00:00Z', pollVoteCounts: {}, paidUserIds: [] } as unknown as GroupMessageApiDto;
  const thread = { key: 'group:73', id: 73, kind: 'group', title: 'Group', preview: null, unread: 0, updatedAt: null, group: { status: 'Active' } } as Thread;
  const edit = vi.fn(), voters = vi.fn();
  const props = { message, thread, userId: 42, busy: false, onInteract: vi.fn(), onQr: vi.fn(), onEdit: edit, onVoters: voters };
  const view = render(<MessageCard {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa' }));
  fireEvent.click(screen.getByRole('button', { name: 'Xem người bình chọn' }));
  expect(edit).toHaveBeenCalledWith(message); expect(voters).toHaveBeenCalledWith(message);
  view.rerender(<MessageCard {...props} userId={43} />);
  expect(screen.queryByRole('button', { name: 'Chỉnh sửa' })).toBeNull();
});
it.each([null, 4, 'invalid', {}, { userId: 42 }])('does not crash or offer a payment for malformed participants: %j', participant => {
  const message = { messageId: 1, groupId: 73, senderUserId: 42, senderName: 'Member', content: 'Expense', messageType: 'split_bill', metadataJson: JSON.stringify({ participants: [participant], totalAmount: 100 }), createdAtUtc: '2026-11-24T00:00:00Z', paidUserIds: [] } as unknown as GroupMessageApiDto;
  const thread = { key: 'group:73', id: 73, kind: 'group', title: 'Group', preview: null, unread: 0, updatedAt: null } satisfies Thread;
  render(<MessageCard message={message} thread={thread} userId={42} busy={false} onInteract={vi.fn()} onQr={vi.fn()} />);
  expect(screen.getByText(/Không có phần chia hợp lệ/)).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Quét VietQR chuyển tiền' })).toBeNull();
});
