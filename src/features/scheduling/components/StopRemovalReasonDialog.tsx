'use client';

import { useRef } from 'react';

import type { StopRemovalReason } from '../types/schedulingTypes';
import { useDialogFocus } from './useDialogFocus';

const REASONS: ReadonlyArray<{ reason: StopRemovalReason; label: string }> = [
  { reason: 'NotInterested', label: 'Không thích' },
  { reason: 'NoTime', label: 'Không đủ thời gian' },
  { reason: 'AlreadyVisited', label: 'Đã đi rồi' },
];

interface StopRemovalReasonDialogProps {
  stopName: string;
  onChoose: (reason: StopRemovalReason) => void;
  onClose: () => void;
}

/**
 * "Bỏ khỏi lịch" asks why (UC-10 feedback, D10, D14). Picking a reason is the confirmation; closing the
 * dialog (button, Escape, backdrop) removes nothing.
 */
export function StopRemovalReasonDialog({ stopName, onChoose, onClose }: StopRemovalReasonDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(dialogRef, closeRef, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-removal-title"
        className="w-full max-w-sm overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="stop-removal-title" className="text-base font-bold text-slate-900">
              Vì sao bạn bỏ điểm này?
            </h2>
            <p className="mt-1 truncate text-xs text-slate-500">{stopName}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
        <div className="flex flex-col gap-2 px-5 py-4">
          {REASONS.map(({ reason, label }) => (
            <button
              key={reason}
              type="button"
              onClick={() => onChoose(reason)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
