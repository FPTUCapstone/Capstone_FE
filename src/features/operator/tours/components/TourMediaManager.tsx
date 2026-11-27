'use client';

import React, { useRef, useState } from 'react';
import {
  removeTourImage,
  reorderTourImages,
  setPrimaryTourImage,
  uploadTourImage,
  validateTourImage,
} from '../services/operatorTourService';
import type { TourMediaItem } from '../types/tourLifecycle';

interface TourMediaManagerProps {
  tourId: string;
  tourTitle: string;
  media: TourMediaItem[];
  onChange: (media: TourMediaItem[]) => void;
  disabled?: boolean;
  onReadinessChange?: () => void;
  confirmOnDelete?: boolean;
}

/** Cover photo management for an existing tour. */
export function TourMediaManager({
  tourId,
  tourTitle,
  media,
  onChange,
  disabled = false,
  onReadinessChange,
  confirmOnDelete = false,
}: TourMediaManagerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // One key per picked file: retrying the same file after a lost response replays the same upload.
  const pendingKeys = useRef(new Map<string, string>());

  const run = async (action: () => Promise<TourMediaItem[]>) => {
    setError(null);
    setBusy(true);
    try {
      onChange(await action());
      setConfirmDeleteId(null);
      onReadinessChange?.();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Không thể cập nhật hình ảnh lúc này. Vui lòng thử lại sau.');
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
        onReadinessChange?.();
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Không thể tải ảnh lên lúc này. Vui lòng thử lại sau.');
        setBusy(false);
        return;
      }
    }
    setBusy(false);
  };

  const handleMove = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= media.length) return;
    const reordered = [...media];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    const primary = reordered.find((m) => m.isPrimary) ?? reordered[0];
    if (!primary) return;
    void run(() => reorderTourImages(tourId, reordered.map((m) => m.id), primary.id));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6" aria-labelledby="tour-media-title">
      <h3 id="tour-media-title" className="border-b border-slate-100 pb-3 text-base font-extrabold text-[#1C2928]">
        Hình ảnh giới thiệu
      </h3>
      <p className="mt-1 text-[11px] text-slate-500">
        Tệp hình ảnh tối đa 5MB mỗi ảnh. Cần có một ảnh đại diện trước khi gửi xét duyệt.
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
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((item, idx) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.caption ?? tourTitle} className="aspect-[4/3] w-full rounded-lg object-cover" />
              <div className="flex min-h-9 flex-wrap items-center justify-between gap-1 px-1 pt-1.5 text-[11px]">
                {item.isPrimary ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">Ảnh đại diện</span>
                ) : (
                  <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => void run(() => setPrimaryTourImage(tourId, item.id))}
                    className="font-bold text-[#174B4A] hover:underline disabled:opacity-50"
                  >
                    Đặt làm ảnh đại diện
                  </button>
                )}
                {!disabled && (
                  <div className="flex items-center gap-0.5">
                    {media.length > 1 && (
                      <>
                        <button
                          type="button"
                          disabled={busy || idx === 0}
                          aria-label="Di chuyển ảnh lên"
                          onClick={() => handleMove(idx, -1)}
                          className="grid h-7 w-6 place-items-center rounded text-slate-600 hover:bg-slate-200/70 disabled:opacity-30"
                          title="Di chuyển lên"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={busy || idx === media.length - 1}
                          aria-label="Di chuyển ảnh xuống"
                          onClick={() => handleMove(idx, 1)}
                          className="grid h-7 w-6 place-items-center rounded text-slate-600 hover:bg-slate-200/70 disabled:opacity-30"
                          title="Di chuyển xuống"
                        >
                          ↓
                        </button>
                      </>
                    )}
                    {confirmOnDelete && confirmDeleteId === item.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void run(() => removeTourImage(tourId, item.id))}
                          className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                        >
                          Hủy
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        aria-label="Xóa ảnh"
                        onClick={() => {
                          if (confirmOnDelete) {
                            setConfirmDeleteId(item.id);
                          } else {
                            void run(() => removeTourImage(tourId, item.id));
                          }
                        }}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        title="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
