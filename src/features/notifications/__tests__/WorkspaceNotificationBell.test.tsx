import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceNotificationBell } from '../WorkspaceNotificationBell';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  markRead: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('../useNotificationInbox', () => ({
  useNotificationInbox: () => ({
    items: [{
      id: 55,
      type: 'MSG205',
      title: 'New service booking request',
      body: 'New booking request SR-42 for Double room on 2026-11-26.',
      relatedEntityType: 'ServiceBooking',
      relatedEntityId: 42,
      createdAtUtc: '2026-11-25T10:00:00Z',
      isRead: false,
    }],
    unreadCount: 1,
    markRead: mocks.markRead,
    refresh: vi.fn(),
  }),
}));

describe('Provider booking notification', () => {
  it('marks MSG205 as read before opening the Provider booking detail', async () => {
    mocks.markRead.mockResolvedValue(true);
    render(<WorkspaceNotificationBell role="ServiceProvider" />);
    fireEvent.click(screen.getByRole('button', { name: 'Thông báo' }));
    fireEvent.click(screen.getByRole('button', { name: /New service booking request/ }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/provider/bookings/42'));
    expect(mocks.markRead).toHaveBeenCalledWith(55);
    expect(mocks.markRead.mock.invocationCallOrder[0]).toBeLessThan(mocks.push.mock.invocationCallOrder[0]);
  });
});
