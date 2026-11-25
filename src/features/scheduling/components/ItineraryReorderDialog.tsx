'use client';

import { useMemo, useRef, useState } from 'react';

import { formatVietnamTime, ItineraryDetailItemDto } from '../types/schedulingTypes';
import { useDialogFocus } from './useDialogFocus';

interface ItineraryReorderDialogProps {
  items: ItineraryDetailItemDto[];
  busy: boolean;
  error: string | null;
  onSave: (orderedPoiIds: number[]) => void;
  onClose: () => void;
}

/** Reorder modal with native drag-and-drop and accessible ↑/↓ controls (Review 2, §3.4). */
export function ItineraryReorderDialog({
  items,
  busy,
  error,
  onSave,
  onClose,
}: ItineraryReorderDialogProps) {
  const initialIds = useMemo(
    () => items.map((item) => item.poiId).filter((poiId): poiId is number => poiId !== null),
    [items],
  );
  const [orderedIds, setOrderedIds] = useState<number[]>(initialIds);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(dialogRef, closeRef, () => {
    if (!busy) onClose();
  });

  const { itemByPoiId, originalIndexByPoiId } = useMemo(() => {
    const byId = new Map<number, ItineraryDetailItemDto>();
    const originIdx = new Map<number, number>();
    items.forEach((item, index) => {
      if (item.poiId === null) return;
      byId.set(item.poiId, item);
      originIdx.set(item.poiId, index);
    });
    return { itemByPoiId: byId, originalIndexByPoiId: originIdx };
  }, [items]);

  const hasChanges =
    orderedIds.length === initialIds.length &&
    orderedIds.some((id, index) => id !== initialIds[index]);

  const moveBy = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedIds.length) return;
    setOrderedIds((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const moveTo = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setOrderedIds((current) => {
      if (fromIndex >= current.length || toIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      if (moved === undefined) return current;
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const resetOrder = () => {
    setOrderedIds(initialIds);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1C2928]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reorder-stops-title"
        className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-[#DCE2DD] bg-white shadow-xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#DCE2DD] bg-[#F7F5EF]/80 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#174B4A]">
              Chỉnh sửa lộ trình
            </p>
            <h2 id="reorder-stops-title" className="mt-0.5 text-base font-bold text-[#1C2928] sm:text-lg">
              Sắp xếp lại các điểm tham quan
            </h2>
            <p className="mt-0.5 text-xs text-[#5B6E69]">
              Kéo thả hoặc dùng nút lên/xuống để đổi thứ tự. Điểm nghỉ được hệ thống giữ nguyên.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-[#5B6E69] transition hover:bg-[#DCE2DD]/50 hover:text-[#1C2928] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4">
          <ol className="relative space-y-2.5">
            {orderedIds.map((poiId, index) => {
              const item = itemByPoiId.get(poiId);
              if (!item) return null;

              const isDining =
                item.costKind === 'AverageSpend' ||
                Boolean(
                  item.category &&
                    /ẩm thực|quán|nhà hàng|food|restaurant|cafe|coffee|ăn uống/i.test(item.category),
                );
              const originalIndex = originalIndexByPoiId.get(poiId) ?? index;
              const moved = originalIndex !== index;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;
              const arrival = item.plannedArrival ? formatVietnamTime(item.plannedArrival) : null;
              const hasValidArrival = Boolean(arrival && arrival !== '--:--');
              const stopName = item.poiName ?? 'Điểm tham quan';

              return (
                <li
                  key={item.itemId || poiId}
                  draggable={!busy}
                  onDragStart={(event) => {
                    if (busy) {
                      event.preventDefault();
                      return;
                    }
                    setDraggedIndex(index);
                    if (event.dataTransfer) {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', String(index));
                    }
                  }}
                  onDragOver={(event) => {
                    if (busy) return;
                    event.preventDefault();
                    if (event.dataTransfer) {
                      event.dataTransfer.dropEffect = 'move';
                    }
                    if (dragOverIndex !== index) {
                      setDragOverIndex(index);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (busy) return;
                    const transferred = event.dataTransfer?.getData('text/plain');
                    const parsedTransferred =
                      transferred !== undefined && transferred !== '' ? Number(transferred) : Number.NaN;
                    const fromIndex =
                      draggedIndex !== null ? draggedIndex : parsedTransferred;
                    if (Number.isInteger(fromIndex) && fromIndex >= 0 && fromIndex < orderedIds.length) {
                      moveTo(fromIndex, index);
                    }
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                    !busy ? 'cursor-grab active:cursor-grabbing' : ''
                  } ${
                    isDragging
                      ? 'border-[#174B4A]/40 bg-white opacity-50'
                      : isDragOver
                      ? 'border-[#174B4A] bg-[#E8F0EA]/40 ring-2 ring-[#174B4A]/20'
                      : moved
                      ? 'border-[#174B4A]/35 bg-[#E8F0EA]/20'
                      : 'border-[#DCE2DD] bg-white hover:border-[#174B4A]/35'
                  }`}
                >
                  {/* 2x3 Pure CSS Drag Handle */}
                  <span className="grid shrink-0 grid-cols-2 gap-0.5 py-1" aria-hidden="true">
                    <span className="h-1 w-1 rounded-full bg-[#5B6E69]/50" />
                    <span className="h-1 w-1 rounded-full bg-[#5B6E69]/50" />
                    <span className="h-1 w-1 rounded-full bg-[#5B6E69]/50" />
                    <span className="h-1 w-1 rounded-full bg-[#5B6E69]/50" />
                    <span className="h-1 w-1 rounded-full bg-[#5B6E69]/50" />
                    <span className="h-1 w-1 rounded-full bg-[#5B6E69]/50" />
                  </span>

                  {/* Circular Sequence Badge */}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      isDining ? 'bg-[#B96D4C]' : 'bg-[#174B4A]'
                    }`}
                  >
                    {index + 1}
                  </span>

                  {/* Stop Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-[#1C2928]">
                        {stopName}
                      </span>
                      {moved && (
                        <span className="shrink-0 rounded-full bg-[#E8F0EA] px-2 py-0.5 text-[10px] font-semibold text-[#174B4A]">
                          từ #{originalIndex + 1}
                        </span>
                      )}
                      {item.isMandatory && (
                        <span className="shrink-0 rounded-full border border-rose-200/80 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                          Bắt buộc
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-[#5B6E69]">
                      <span>{isDining ? 'Ăn uống' : 'Tham quan'}</span>
                      <span aria-hidden="true">•</span>
                      <span>{item.stayDurationMinutes} phút</span>
                      {hasValidArrival && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span>Hiện tại {arrival}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Accessible Up/Down Controls */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Di chuyển ${item.poiName ?? index + 1} lên`}
                      onClick={() => moveBy(index, -1)}
                      disabled={index === 0 || busy}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2DD] bg-[#F7F5EF]/70 text-xs font-bold text-[#1C2928] transition hover:border-[#174B4A]/50 hover:bg-[#E8F0EA] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Di chuyển ${item.poiName ?? index + 1} xuống`}
                      onClick={() => moveBy(index, 1)}
                      disabled={index === orderedIds.length - 1 || busy}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE2DD] bg-[#F7F5EF]/70 text-xs font-bold text-[#1C2928] transition hover:border-[#174B4A]/50 hover:bg-[#E8F0EA] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      ↓
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE2DD] bg-[#F7F5EF]/80 px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs text-[#5B6E69]">
            <span>
              {hasChanges
                ? 'Đã thay đổi vị trí'
                : `${orderedIds.length} điểm dừng · Chưa có thay đổi`}
            </span>
            {hasChanges && (
              <button
                type="button"
                onClick={resetOrder}
                disabled={busy}
                className="font-semibold text-[#174B4A] hover:underline disabled:opacity-50"
              >
                Đặt lại
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-[#DCE2DD] bg-white px-4 py-2 text-xs font-semibold text-[#1C2928] transition hover:bg-[#F7F5EF] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onSave(orderedIds)}
              disabled={busy || !hasChanges || orderedIds.length === 0}
              className="rounded-xl bg-[#174B4A] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#103B39] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Đang lưu…' : 'Lưu thứ tự mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
