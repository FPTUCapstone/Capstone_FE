import { describe, it, expect } from 'vitest';
import { parseNotificationInboxItem, parseNotificationInboxResponse, NotificationParseError } from '../parsers';

const mockItem = {
  id: 1,
  type: 'TourApproved',
  title: 'Tour approved',
  body: 'Your tour package "Hoi An Walking Tour" was approved.',
  relatedEntityType: 'Tour',
  relatedEntityId: 196,
  createdAtUtc: '2026-11-24T03:55:57.7299068Z',
  isRead: false,
};

describe('parseNotificationInboxItem', () => {
  it('parses a valid notification item', () => {
    const result = parseNotificationInboxItem(mockItem);
    expect(result).toEqual(mockItem);
  });

  it('accepts null relatedEntityType/relatedEntityId', () => {
    const result = parseNotificationInboxItem({
      ...mockItem,
      relatedEntityType: null,
      relatedEntityId: null,
    });
    expect(result.relatedEntityType).toBeNull();
    expect(result.relatedEntityId).toBeNull();
  });

  it('throws NotificationParseError when id is invalid', () => {
    expect(() => parseNotificationInboxItem({ ...mockItem, id: -1 })).toThrow(NotificationParseError);
  });

  it('shows legacy rows whose saved title and body are null', () => {
    const result = parseNotificationInboxItem({ ...mockItem, title: null, body: null });
    expect(result).toMatchObject({ title: 'Thông báo', body: '' });
  });

  it('throws NotificationParseError when title has an invalid type', () => {
    expect(() => parseNotificationInboxItem({ ...mockItem, title: 17 })).toThrow(NotificationParseError);
  });

  it('throws NotificationParseError when createdAtUtc is not a valid date', () => {
    expect(() => parseNotificationInboxItem({ ...mockItem, createdAtUtc: 'not-a-date' })).toThrow(NotificationParseError);
  });

  it('throws NotificationParseError when isRead is not boolean', () => {
    expect(() => parseNotificationInboxItem({ ...mockItem, isRead: 'false' })).toThrow(NotificationParseError);
  });

  it('throws NotificationParseError when payload is not an object', () => {
    expect(() => parseNotificationInboxItem(null)).toThrow(NotificationParseError);
  });
});

describe('parseNotificationInboxResponse', () => {
  it('parses a valid inbox response with items and nextBeforeId', () => {
    const result = parseNotificationInboxResponse({
      items: [mockItem],
      nextBeforeId: 5,
    });
    expect(result.items).toHaveLength(1);
    expect(result.nextBeforeId).toBe(5);
  });

  it('defaults nextBeforeId to null when absent', () => {
    const result = parseNotificationInboxResponse({ items: [] });
    expect(result.nextBeforeId).toBeNull();
  });

  it('throws when items is not an array', () => {
    expect(() => parseNotificationInboxResponse({ items: 'nope' })).toThrow(NotificationParseError);
  });

  it('propagates item parse errors', () => {
    expect(() => parseNotificationInboxResponse({ items: [{ id: -1 }] })).toThrow(NotificationParseError);
  });
});
