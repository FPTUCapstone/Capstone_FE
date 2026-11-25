'use client';

import React, { useState } from 'react';
import { useChatDialog } from './useChatDialog';
import { BroadcastData } from '../types/groupChatTypes';

interface BroadcastModalProps {
  apiError?: string;
  onClose: () => void;
  onSubmit: (broadcastData: BroadcastData) => Promise<boolean> | boolean;
}

export function BroadcastModal({ onClose, onSubmit, apiError }: BroadcastModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'high' | 'normal'>('high');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useChatDialog(onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setError('Vui lòng nhập tiêu đề thông báo.');
      return;
    }
    if (!trimmedContent) {
      setError('Vui lòng nhập nội dung thông báo cho đoàn.');
      return;
    }

    const data: BroadcastData = {
      title: trimmedTitle,
      content: trimmedContent,
      priority,
      acknowledgedUserIds: [], // Only server receipts establish acknowledgement.
    };

    setSaving(true);
    let saved = false;
    try { saved = await onSubmit(data); }
    catch { setError('Chưa lưu được nội dung. Vui lòng thử lại.'); }
    finally { setSaving(false); }
    if (saved) onClose();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadcast-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-lg">campaign</span>
            </div>
            <div>
              <h3 id="broadcast-modal-title" className="text-sm font-bold text-slate-900">
                Phát thông báo cho đoàn Tour
              </h3>
              <p className="text-[11px] text-slate-500">
                Thông báo ưu tiên cao & yêu cầu thành viên xác nhận đã đọc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề thông báo <span className="text-rose-500">*</span>
            </label>
            <input
                aria-label="Tiêu đề thông báo"
                disabled={saving}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="VD: LỊCH KHỞI HÀNH & TẬP TRUNG SÁNG MAI"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold uppercase text-slate-900 placeholder:text-slate-400 focus:border-[#103B39] focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mức độ ưu tiên
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  priority === 'high'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-rose-600">priority_high</span>
                <span>Khẩn cấp / Quan trọng</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  priority === 'normal'
                    ? 'bg-teal-100 text-[#103B39] border border-teal-300'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Tiêu chuẩn</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nội dung thông báo <span className="text-rose-500">*</span>
            </label>
            <textarea
                aria-label="Nội dung thông báo"
                disabled={saving}
              rows={4}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              placeholder="Nhập chi tiết giờ đón, địa điểm, giấy tờ bắt buộc mang theo..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#103B39] focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Tin nhắn này sẽ hiển thị huy hiệu nổi bật và có nút cho khách xác nhận &quot;Đã đọc và hiểu&quot;.
            </p>
          </div>

          {(error || apiError) && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-rose-600">error</span>
              <span>{error || apiError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#103B39] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#174B4A] transition"
            >
              Phát thông báo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
