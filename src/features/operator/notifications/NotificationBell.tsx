'use client';

import { useState } from 'react';
import type { NotificationInboxItem } from './types';

export interface NotificationBellProps {
  items: readonly NotificationInboxItem[];
  unreadCount: number;
  onMarkRead: (notificationId: number) => void;
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

export function NotificationBell({ items, unreadCount, onMarkRead }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative p-1.5 text-slate-500 hover:text-[#1C2928] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        aria-label="Thông báo"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          notifications
        </span>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#B96D4C] text-white text-[10px] font-bold leading-none"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-[#1C2928]">Thông báo</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Không có thông báo nào.
              </div>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.isRead) onMarkRead(item.id);
                      }}
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
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(item.createdAtUtc)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
