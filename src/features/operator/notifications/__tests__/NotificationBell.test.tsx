import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationBell } from '../NotificationBell';
import type { NotificationInboxItem } from '../types';

const unreadItem: NotificationInboxItem = {
  id: 1,
  type: 'TourApproved',
  title: 'Tour approved',
  body: 'Your tour package "Ba Na Hills" was approved.',
  relatedEntityType: 'Tour',
  relatedEntityId: 196,
  createdAtUtc: '2026-11-24T03:55:57.729Z',
  isRead: false,
};

const readItem: NotificationInboxItem = {
  ...unreadItem,
  id: 2,
  title: 'Tour rejected',
  body: 'Your tour package "Hoi An Walking Tour" was rejected.',
  isRead: true,
};

describe('NotificationBell', () => {
  it('renders the bell without a badge when there are no unread notifications', () => {
    render(<NotificationBell items={[readItem]} unreadCount={0} onMarkRead={vi.fn()} />);

    expect(screen.getByRole('button', { name: /thông báo/i })).toBeDefined();
    expect(screen.queryByTestId('notification-badge')).toBeNull();
  });

  it('renders a badge with the unread count', () => {
    render(<NotificationBell items={[unreadItem]} unreadCount={1} onMarkRead={vi.fn()} />);

    expect(screen.getByTestId('notification-badge').textContent).toBe('1');
  });

  it('caps the badge display at "9+" for large counts', () => {
    render(<NotificationBell items={[unreadItem]} unreadCount={15} onMarkRead={vi.fn()} />);

    expect(screen.getByTestId('notification-badge').textContent).toBe('9+');
  });

  it('opens the dropdown on click and lists notifications', () => {
    render(<NotificationBell items={[unreadItem, readItem]} unreadCount={1} onMarkRead={vi.fn()} />);

    expect(screen.queryByText(unreadItem.title)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /thông báo/i }));

    expect(screen.getByText(unreadItem.title)).toBeDefined();
    expect(screen.getByText(unreadItem.body)).toBeDefined();
  });

  it('shows an empty state when there are no notifications', () => {
    render(<NotificationBell items={[]} unreadCount={0} onMarkRead={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /thông báo/i }));

    expect(screen.getByText(/không có thông báo/i)).toBeDefined();
  });

  it('calls onMarkRead when an unread item is clicked', () => {
    const onMarkRead = vi.fn();
    render(<NotificationBell items={[unreadItem]} unreadCount={1} onMarkRead={onMarkRead} />);

    fireEvent.click(screen.getByRole('button', { name: /thông báo/i }));
    fireEvent.click(screen.getByText(unreadItem.title));

    expect(onMarkRead).toHaveBeenCalledWith(1);
  });

  it('does not call onMarkRead again for an already-read item', () => {
    const onMarkRead = vi.fn();
    render(<NotificationBell items={[readItem]} unreadCount={0} onMarkRead={onMarkRead} />);

    fireEvent.click(screen.getByRole('button', { name: /thông báo/i }));
    fireEvent.click(screen.getByText(readItem.title));

    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it('closes the dropdown when clicking the bell again', () => {
    render(<NotificationBell items={[unreadItem]} unreadCount={1} onMarkRead={vi.fn()} />);

    const bellButton = screen.getByRole('button', { name: /thông báo/i });
    fireEvent.click(bellButton);
    expect(screen.getByText(unreadItem.title)).toBeDefined();

    fireEvent.click(bellButton);
    expect(screen.queryByText(unreadItem.title)).toBeNull();
  });
});
