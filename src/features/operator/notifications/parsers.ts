import { isRecord } from '@/lib/typeGuards';
import type { NotificationInboxItem, NotificationInboxResponse } from './types';

export class NotificationParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationParseError';
  }
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

export function parseNotificationInboxItem(data: unknown): NotificationInboxItem {
  if (!isRecord(data)) {
    throw new NotificationParseError('Notification payload must be a JSON object.');
  }

  const {
    id,
    type,
    title,
    body,
    relatedEntityType,
    relatedEntityId,
    createdAtUtc,
    isRead,
  } = data;

  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
    throw new NotificationParseError(`Invalid notification id: ${String(id)}`);
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw new NotificationParseError('type must be a non-empty string.');
  }
  if (typeof title !== 'string' || !title.trim()) {
    throw new NotificationParseError('title must be a non-empty string.');
  }
  if (typeof body !== 'string') {
    throw new NotificationParseError('body must be a string.');
  }
  if (relatedEntityType !== null && typeof relatedEntityType !== 'string') {
    throw new NotificationParseError('relatedEntityType must be a string or null.');
  }
  if (relatedEntityId !== null && (typeof relatedEntityId !== 'number' || !Number.isSafeInteger(relatedEntityId))) {
    throw new NotificationParseError('relatedEntityId must be an integer or null.');
  }
  if (!isValidIsoDate(createdAtUtc)) {
    throw new NotificationParseError('createdAtUtc must be a valid ISO date string.');
  }
  if (typeof isRead !== 'boolean') {
    throw new NotificationParseError('isRead must be a boolean.');
  }

  return {
    id,
    type,
    title,
    body,
    relatedEntityType: relatedEntityType ?? null,
    relatedEntityId: relatedEntityId ?? null,
    createdAtUtc,
    isRead,
  };
}

export function parseNotificationInboxResponse(data: unknown): NotificationInboxResponse {
  if (!isRecord(data)) {
    throw new NotificationParseError('Notification inbox response must be a JSON object.');
  }

  const { items, nextBeforeId } = data;

  if (!Array.isArray(items)) {
    throw new NotificationParseError('items must be an array.');
  }
  if (nextBeforeId !== null && nextBeforeId !== undefined &&
      (typeof nextBeforeId !== 'number' || !Number.isSafeInteger(nextBeforeId))) {
    throw new NotificationParseError('nextBeforeId must be an integer or null.');
  }

  return {
    items: items.map(parseNotificationInboxItem),
    nextBeforeId: nextBeforeId ?? null,
  };
}
