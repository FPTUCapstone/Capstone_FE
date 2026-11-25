'use client';

import { useId, useRef, useState } from 'react';
import type { NotificationInboxItem } from './types';

export interface NotificationBellProps {
  items: readonly NotificationInboxItem[];
  unreadCount: number;
  onMarkRead: (notificationId: number) => unknown;
  onOpenItem?: (item: NotificationInboxItem) => void;
  onOpen?: () => void;
  unreadOnly?: boolean;
  onUnreadOnlyChange?: (value: boolean) => void;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
  onLoadMore?: () => void;
}

function formatRelativeTime(isoDate: string): string {
  const createdAt = new Date(isoDate).getTime();
  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

export function NotificationBell({
  items, unreadCount, onMarkRead, onOpenItem, onOpen, unreadOnly, onUnreadOnlyChange,
  error, loading, onRetry, onLoadMore,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div className="relative" onKeyDown={(event) => {
      if (event.key === 'Escape' && isOpen) {
        event.stopPropagation();
        setIsOpen(false);
        trigger.current?.focus();
      }
    }}>
      <button
        ref={trigger}
        type="button"
        onClick={() => {
          if (!isOpen) onOpen?.();
          setIsOpen(!isOpen);
        }}
        className="relative inline-flex size-11 items-center justify-center rounded-lg text-text-secondary hover:bg-soft-accent hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Thông báo"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          notifications
        </span>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute right-0 top-0 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold leading-none"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div id={panelId} className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-6rem)] rounded-xl border border-border bg-surface shadow-lg z-50 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-border">
            <span className="text-sm font-bold text-text-primary">Thông báo</span>
            {onUnreadOnlyChange && (
              <label className="flex min-h-11 items-center gap-2 text-xs">
                <input type="checkbox" checked={unreadOnly} onChange={(event) => onUnreadOnlyChange(event.target.checked)} />
                Chưa đọc
              </label>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {error && (
              <div className="px-4 py-2 text-sm">
                <p role="alert">{error}</p>
                <button type="button" className="min-h-11 font-semibold text-primary" onClick={onRetry}>Thử lại</button>
              </div>
            )}
            {loading && <p role="status" className="px-4 py-2 text-sm text-text-secondary">Đang tải thông báo…</p>}
            {items.length === 0 ? (
              !loading && !error && <div className="px-4 py-6 text-center text-sm text-text-secondary">
                {unreadOnly ? 'Không có thông báo chưa đọc.' : 'Không có thông báo nào.'}
              </div>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenItem) onOpenItem(item);
                        else if (!item.isRead) onMarkRead(item.id);
                      }}
                      aria-label={`${item.title} · ${item.isRead ? 'Đã đọc' : 'Chưa đọc'}`}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors ${
                        item.isRead ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!item.isRead && (
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#174B4A] shrink-0" aria-hidden="true" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1C2928] truncate">{item.title}</p>
                          {item.body && <p className="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap break-words">{item.body}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(item.createdAtUtc)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {onLoadMore && (
              <button type="button" className="min-h-11 w-full font-semibold text-primary" disabled={loading} onClick={onLoadMore}>
                Tải thêm
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
