'use client';

import React, { useState } from 'react';
import { useChatDialog } from './useChatDialog';
import { PollData } from '../types/groupChatTypes';

interface CreatePollModalProps {
  initialData?: PollData;
  title?: string;
  submitLabel?: string;
  apiError?: string;
  onClose: () => void;
  onSubmit: (pollData: PollData) => Promise<boolean> | boolean;
}

export function CreatePollModal({ onClose, onSubmit, apiError, initialData, title = 'Tạo bình chọn nhóm', submitLabel = 'Tạo bình chọn' }: CreatePollModalProps) {
  const [question, setQuestion] = useState(initialData?.question ?? '');
  const [options, setOptions] = useState<string[]>(initialData?.options.map(option => option.text) ?? ['', '']);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useChatDialog(onClose);
  const hasVotes = (initialData?.totalVotes ?? 0) > 0;
  const existingOptionCount = initialData?.options.length ?? 0;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (hasVotes && index < existingOptionCount) return;
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    if (hasVotes && index < existingOptionCount) return;
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Vui lòng nhập câu hỏi bình chọn.');
      return;
    }
    if (trimmedQuestion.length > 200) {
      setError('Câu hỏi bình chọn không được quá 200 ký tự.');
      return;
    }

    const validOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (validOptions.length < 2 || validOptions.length > 6) {
      setError('Vui lòng nhập ít nhất 2 lựa chọn bình chọn, tối đa 6 lựa chọn.');
      return;
    }
    if (validOptions.some(option => option.length > 200)) {
      setError('Mỗi lựa chọn không được quá 200 ký tự.');
      return;
    }
    if (new Set(validOptions.map(option => option.toUpperCase())).size !== validOptions.length) {
      setError('Các lựa chọn bình chọn không được trùng nhau.');
      return;
    }
    if (hasVotes && (trimmedQuestion !== initialData!.question.trim()
      || initialData!.options.some((option, index) => option.text.trim() !== validOptions[index]))) {
      setError('Bình chọn đã có phiếu bầu chỉ được thêm lựa chọn mới.');
      return;
    }

    const poll: PollData = {
      question: trimmedQuestion,
      options: validOptions.map((text, idx) => hasVotes && idx < existingOptionCount ? { ...initialData!.options[idx], text } : ({
        id: String(idx),
        text,
        voterUserIds: [],
      })),
      totalVotes: initialData?.totalVotes ?? 0,
    };

    setSaving(true);
    let saved = false;
    try { saved = await onSubmit(poll); }
    catch { setError('Chưa lưu được nội dung. Vui lòng thử lại.'); }
    finally { setSaving(false); }
    if (saved) onClose();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-poll-title"
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-sm rounded-2xl border border-brand-border bg-white p-4 shadow-2xl sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#103B39]">
              <span className="material-symbols-outlined text-lg">poll</span>
            </div>
            <div>
              <h3 id="create-poll-title" className="break-words text-sm font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500">Lấy ý kiến biểu quyết của các thành viên</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Câu hỏi bình chọn <span className="text-rose-500">*</span>
            </label>
            <input
                aria-label="Câu hỏi bình chọn"
                disabled={saving || hasVotes}
              type="text"
              maxLength={200}
              value={question}
              onChange={(e) => {
                if (!hasVotes) setQuestion(e.target.value);
                setError(null);
              }}
              placeholder="VD: Trưa nay cả nhóm ăn gì?"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#103B39] focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Các lựa chọn (Tối thiểu 2) <span className="text-rose-500">*</span>
            </label>
            {hasVotes && <p className="mb-2 text-xs text-brand-textSecondary">Đã có phiếu bầu. Giữ nguyên câu hỏi và các lựa chọn hiện có; bạn có thể thêm lựa chọn mới, tối đa 6.</p>}
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                  <input
                aria-label={`Lựa chọn ${idx + 1}`}
                disabled={saving || (hasVotes && idx < existingOptionCount)}
                    type="text"
                    maxLength={200}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Lựa chọn ${idx + 1}`}
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#103B39] focus:outline-none focus:ring-1 focus:ring-[#103B39]"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      disabled={saving || (hasVotes && idx < existingOptionCount)}
                      aria-label={`Xóa lựa chọn ${idx + 1}`}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition"
                      title="Xóa lựa chọn"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                disabled={saving}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#103B39] hover:underline"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>Thêm lựa chọn khác</span>
              </button>
            )}
          </div>

          {(error || apiError) && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-rose-600">error</span>
              <span>{error || apiError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
