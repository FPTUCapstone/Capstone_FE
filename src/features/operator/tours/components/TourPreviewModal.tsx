'use client';

import React, { useEffect } from 'react';
import type { TourDepartureSchedule, TourItineraryDay } from '../types/tourLifecycle';

export interface TourPreviewData {
  title: string;
  destination: string;
  category?: string;
  durationDays: number;
  basePrice: number;
  childPrice?: number;
  description: string;
  highlights?: string;
  travellerRequirements?: string;
  inclusions?: string;
  exclusions?: string;
  cancellationPolicy: string;
  itinerary: TourItineraryDay[];
  schedules: TourDepartureSchedule[];
  mediaUrls: string[];
}

interface TourPreviewModalProps {
  open: boolean;
  onClose: () => void;
  preview: TourPreviewData;
}

const formatVnd = (amount: number) => `${amount.toLocaleString('vi-VN')} đ`;

export function TourPreviewModal({ open, onClose, preview }: TourPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-preview-modal-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div>
            <h2 id="tour-preview-modal-title" className="text-base font-extrabold text-[#1C2928]">
              Xem trước hiển thị trên trang Du khách
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Kiểm tra bố cục nội dung, lịch trình và giá vé trước khi gửi xét duyệt hoặc xuất bản.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem trước"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {preview.mediaUrls.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.mediaUrls[0]}
                alt={preview.title || 'Ảnh đại diện tour'}
                className="h-52 w-full rounded-xl object-cover sm:col-span-2"
              />
              {preview.mediaUrls.length > 1 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {preview.mediaUrls.slice(1, 3).map((url, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${url}-${idx}`}
                      src={url}
                      alt={`${preview.title} - ảnh ${idx + 2}`}
                      className="h-25 w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {preview.destination && (
                <span className="rounded-md bg-teal-50 px-2.5 py-1 font-bold text-[#103B39]">
                  {preview.destination}
                </span>
              )}
              {preview.category && (
                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  {preview.category}
                </span>
              )}
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                {preview.durationDays} ngày
              </span>
            </div>
            <h3 className="text-xl font-black text-[#1C2928]">{preview.title || 'Chưa nhập tên tour'}</h3>
            <div className="flex flex-wrap items-baseline gap-4 pt-1">
              <span className="text-lg font-black text-[#174B4A]">
                Người lớn: {formatVnd(preview.basePrice || 0)}
              </span>
              {preview.childPrice !== undefined && (
                <span className="text-sm font-bold text-slate-700">
                  Trẻ em: {formatVnd(preview.childPrice)}
                </span>
              )}
            </div>
          </div>

          {preview.highlights && (
            <div>
              <h4 className="text-sm font-bold text-[#1C2928]">Điểm nổi bật</h4>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700">{preview.highlights}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-[#1C2928]">Mô tả chương trình</h4>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700">
              {preview.description || 'Chưa nhập mô tả chi tiết.'}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1C2928]">Lịch trình ({preview.itinerary.length} ngày)</h4>
            <div className="mt-2 space-y-3">
              {preview.itinerary.map((day) => (
                <div key={day.dayNo} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-xs font-extrabold text-[#1C2928]">Ngày {day.dayNo}</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                    {day.activities.map((act) => (
                      <li key={act.id} className="flex flex-wrap gap-2">
                        <span className="font-mono font-bold text-[#174B4A]">{act.time || '--:--'}</span>
                        <span className="font-semibold">{act.poiName || 'Chưa chọn điểm dừng'}</span>
                        <span className="text-slate-500">({act.stayDurationMinutes} phút · {act.transport || 'Di chuyển'})</span>
                        {act.notes && <span className="text-slate-600">— {act.notes}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[#1C2928]">Lịch khởi hành ({preview.schedules.length} đợt)</h4>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {preview.schedules.map((sch) => (
                <div key={sch.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                  <p className="font-bold text-slate-900">
                    {sch.departureDate} → {sch.returnDate}
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Sức chứa: {sch.totalCapacity} khách (tối thiểu {sch.minimumCapacity ?? 1})
                  </p>
                  {sch.meetingPoint && (
                    <p className="mt-0.5 text-slate-600">Điểm đón: {sch.meetingPoint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {(preview.inclusions || preview.exclusions || preview.travellerRequirements) && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
              {preview.inclusions && (
                <div>
                  <h4 className="font-bold text-emerald-900">Bao gồm</h4>
                  <p className="mt-1 whitespace-pre-line text-slate-700">{preview.inclusions}</p>
                </div>
              )}
              {preview.exclusions && (
                <div>
                  <h4 className="font-bold text-rose-900">Không bao gồm</h4>
                  <p className="mt-1 whitespace-pre-line text-slate-700">{preview.exclusions}</p>
                </div>
              )}
              {preview.travellerRequirements && (
                <div className="sm:col-span-2">
                  <h4 className="font-bold text-[#1C2928]">Lưu ý & Yêu cầu du khách</h4>
                  <p className="mt-1 whitespace-pre-line text-slate-700">{preview.travellerRequirements}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#174B4A] px-5 py-2 text-xs font-bold text-white hover:bg-[#103B39]"
          >
            Đóng xem trước
          </button>
        </div>
      </section>
    </div>
  );
}
