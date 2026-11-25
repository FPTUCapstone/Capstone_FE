export interface NotificationInboxItem {
  readonly id: number;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly relatedEntityType: string | null;
  readonly relatedEntityId: number | null;
  readonly createdAtUtc: string;
  readonly isRead: boolean;
}

export interface NotificationInboxResponse {
  readonly items: readonly NotificationInboxItem[];
  readonly nextBeforeId: number | null;
}
