import React from 'react';
import type { WeatherSafetyReview, WeatherSafetyReviewStatus } from '../types';
import { WeatherSafetyReviewStatusBadge } from './WeatherSafetyReviewStatusBadge';
import { ReviewDeadline } from './ReviewDeadline';

interface WeatherSafetyReviewListProps {
  reviews: WeatherSafetyReview[];
  selectedFilter: 'ALL' | WeatherSafetyReviewStatus;
  onFilterChange: (filter: 'ALL' | WeatherSafetyReviewStatus) => void;
  onSelectReview: (reviewId: number) => void;
}

const FILTER_OPTIONS: Array<{ key: 'ALL' | WeatherSafetyReviewStatus; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PendingAcknowledgement', label: 'Chờ xác nhận' },
  { key: 'Escalated', label: 'Quá hạn SLA' },
  { key: 'Acknowledged', label: 'Đã xem' },
  { key: 'Closed', label: 'Đã đóng' },
];

export function WeatherSafetyReviewList({
  reviews,
  selectedFilter,
  onFilterChange,
  onSelectReview,
}: WeatherSafetyReviewListProps) {
  const displayedReviews =
    selectedFilter === 'ALL'
      ? reviews
      : reviews.filter((r) => r.status === selectedFilter);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3" role="tablist">
        {FILTER_OPTIONS.map((option) => {
          const isSelected = selectedFilter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onFilterChange(option.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Review List */}
      {displayedReviews.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          Không có cảnh báo thời tiết nào trong mục này.
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {displayedReviews.map((review) => {
            return (
              <li
                key={review.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-teal-600 transition cursor-pointer"
                onClick={() => onSelectReview(review.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-base hover:text-teal-700">
                      {review.tourTitle}
                    </span>
                    {review.officialVietnamRiskLevel !== null && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Cấp {review.officialVietnamRiskLevel}
                      </span>
                    )}
                  </div>
                  <WeatherSafetyReviewStatusBadge status={review.status} />
                </div>

                {review.isWithdrawn && (
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs text-slate-700 font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-slate-500" aria-hidden="true">
                      info
                    </span>
                    <span>Cảnh báo đã được nhà cung cấp rút lại</span>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">Sự kiện: </span>
                    <span>{review.description || review.eventType}</span>
                  </div>
                  {review.affectedAreaSummary && (
                    <div>
                      <span className="font-semibold text-slate-700">Khu vực: </span>
                      <span>{review.affectedAreaSummary}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <ReviewDeadline
                    deadlineUtc={review.acknowledgementDeadlineUtc}
                    status={review.status}
                  />
                  <span className="text-teal-700 text-xs font-semibold flex items-center gap-1 hover:underline">
                    Xem chi tiết &amp; xử lý &rarr;
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
