import React from 'react';
import type { WeatherSafetyReview } from '../types';

interface WeatherEventSummaryProps {
  review: WeatherSafetyReview;
  className?: string;
}

function formatDateIct(isoString: string | null): string {
  if (!isoString) return 'Chưa xác định';
  return new Date(isoString).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WeatherEventSummary({ review, className = '' }: WeatherEventSummaryProps) {
  return (
    <div className={`space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs ${className}`}>
      {/* Withdrawn Notice */}
      {review.isWithdrawn && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <span className="material-symbols-outlined text-amber-600 text-xl shrink-0" aria-hidden="true">
            warning
          </span>
          <div className="text-sm">
            <p className="font-bold">Cảnh báo đã được nhà cung cấp rút lại</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Nhà cung cấp đã hạ cấp hoặc hủy bỏ cảnh báo này. Tuy nhiên, review vẫn được lưu lại
              để bạn đánh giá tình hình an toàn thực tế trước khi ra quyết định.
            </p>
          </div>
        </div>
      )}

      {/* Tour & Schedule Information */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-900">{review.tourTitle}</h2>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span>Lịch khởi hành:</span>
          <span className="font-medium text-slate-700">
            {formatDateIct(review.scheduleStartAtUtc)} &mdash; {formatDateIct(review.scheduleEndAtUtc)} (ICT)
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
            {review.scheduleStatus || 'Scheduled'}
          </span>
        </div>
      </div>

      {/* Official Vietnam Risk Classification */}
      <div className="rounded-lg bg-teal-50/50 border border-teal-100 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5 mb-3">
          <span className="material-symbols-outlined text-[16px] text-teal-700" aria-hidden="true">
            gavel
          </span>
          Đánh giá rủi ro thiên tai Việt Nam
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Cấp rủi ro thiên tai:</span>
            <span className="font-bold text-base text-teal-800">
              {review.officialVietnamRiskLevel !== null
                ? `Cấp ${review.officialVietnamRiskLevel}`
                : 'Chưa phân cấp'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Cơ quan ban hành:</span>
            <span className="font-semibold text-slate-800">
              {review.originalAuthority || 'Cơ quan dự báo'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Chỉ thị/công điện:</span>
            <span className="font-semibold text-slate-800">
              {review.verifiedDirective || 'Không có chỉ thị bắt buộc'}
            </span>
          </div>
        </div>
      </div>

      {/* Weather Alert Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <div>
            <span className="text-slate-500 block font-medium">Hiện tượng / Mức độ:</span>
            <span className="text-slate-800 font-semibold">
              {review.eventType} &bull; Mức độ: {review.severity}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Mô tả sự kiện:</span>
            <p className="text-slate-800 leading-relaxed font-normal">
              {review.description || 'Không có mô tả chi tiết từ nguồn cấp.'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-slate-500 block font-medium">Thời gian hiệu lực:</span>
            <span className="text-slate-800">
              {formatDateIct(review.validFromUtc)} &mdash; {formatDateIct(review.validToUtc)} (ICT)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Khu vực ảnh hưởng:</span>
            <span className="text-slate-800">
              {review.affectedAreaSummary || 'Chưa xác định cụ thể'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Nguồn dữ liệu:</span>
            <span className="text-slate-600">
              {review.provider} (ID: {review.providerEventId})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
