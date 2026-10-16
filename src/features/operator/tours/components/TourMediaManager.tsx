'use client';

import React, { useRef, useState } from 'react';
import {
  removeTourImage,
  setPrimaryTourImage,
  uploadTourImage,
  validateTourImage,
} from '../services/operatorTourService';
import { OPERATOR_TOUR_MESSAGES, type TourMediaItem } from '../types/tourLifecycle';

interface TourMediaManagerProps {
  tourId: string;
  tourTitle: string;
  media: TourMediaItem[];
  onChange: (media: TourMediaItem[]) => void;
  disabled?: boolean;
}

/** Real-mode cover photo management for a saved draft (backend media flow, BR-16). */
export function TourMediaManager({ tourId, tourTitle, media, onChange, disabled = false }: TourMediaManagerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per picked file: retrying the same file after a lost response replays the same upload.
  const pendingKeys = useRef(new Map<string, string>());

  const run = async (action: () => Promise<TourMediaItem[]>) => {
    setError(null);
    setBusy(true);
    try {
      onChange(await action());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    let current = media;
    for (const file of files) {
      const invalid = validateTourImage(file);
      if (invalid) {
        setError(invalid);
        return;
      }
      const fingerprint = `${file.name}:${file.size}:${file.lastModified}`;
      const key = pendingKeys.current.get(fingerprint) ?? crypto.randomUUID();
      pendingKeys.current.set(fingerprint, key);
      setError(null);
      setBusy(true);
      try {
        current = await uploadTourImage(tourId, file, `${tourTitle} - ${file.name}`.slice(0, 500), {
          makePrimary: current.length === 0,
          idempotencyKey: key,
        });
        pendingKeys.current.delete(fingerprint);
        onChange(current);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
        setBusy(false);
        return;
      }
    }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6" aria-labelledby="tour-media-title">
      <h3 id="tour-media-title" className="border-b border-slate-100 pb-3 text-base font-extrabold text-[#00152A]">
        Hình ảnh giới thiệu
      </h3>
      <p className="mt-1 text-[11px] text-slate-500">
        Tệp hình ảnh tối đa 5MB mỗi ảnh (BR-16). Cần có một ảnh đại diện trước khi gửi xét duyệt.
      </p>

      {!disabled && (
        <label
          htmlFor="media-upload"
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-4 text-center transition hover:bg-slate-50"
        >
          <span className="text-xs font-bold text-slate-700">{busy ? 'Đang xử lý...' : 'Tải lên hình ảnh'}</span>
          <input
            id="media-upload"
            type="file"
            multiple
            accept="image/*"
            disabled={busy}
            onChange={(event) => void handleFiles(event)}
            className="sr-only"
          />
        </label>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}

      {media.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">Chưa có hình ảnh nào.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.caption ?? tourTitle} className="h-24 w-full rounded-lg object-cover" />
              <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                {item.isPrimary ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">Ảnh đại diện</span>
                ) : (
                  <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => void run(() => setPrimaryTourImage(tourId, item.id))}
                    className="font-bold text-[#006B5F] hover:underline disabled:opacity-50"
                  >
                    Đặt làm ảnh đại diện
                  </button>
                )}
                {!disabled && (
                  <button
                    type="button"
                    disabled={busy}
                    aria-label="Xóa ảnh"
                    onClick={() => void run(() => removeTourImage(tourId, item.id))}
                    className="font-bold text-rose-600 hover:underline disabled:opacity-50"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
