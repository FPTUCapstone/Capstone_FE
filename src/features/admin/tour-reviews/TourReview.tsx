import Link from 'next/link';

import { ROUTES } from '@/lib/routes';
import type { PendingTourReview } from '@/types';

import { TourReviewDecisionPanel } from './TourReviewDecisionPanel';

type TourReviewProps = {
  review: PendingTourReview;
};

export function TourReview({ review }: TourReviewProps) {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#191c1e] pb-24 md:pb-12">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={ROUTES.admin.tourReviews}
            className="text-xs font-bold text-[#006b5f] hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại danh sách chờ duyệt
          </Link>
          
          <span className="text-xs font-mono font-bold text-[#74777e] bg-[#eceef1] px-3 py-1 rounded-full">
            Mã kiểm duyệt: {review.id} • Gửi {review.submittedTime}
          </span>
        </div>

        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#c3c6ce]">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#00152a] tracking-tight">
              Kiểm Duyệt Tour: {review.tourName}
            </h1>
            <p className="text-sm text-[#43474d] mt-1">
              Đơn vị tổ chức: <strong className="text-[#00152a]">{review.operatorName}</strong> • {review.location}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#00152a] text-white px-3.5 py-2 rounded-xl flex items-center gap-2 font-mono font-bold text-xs shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-[#71f8e4]">radar</span>
              TripMatch: {review.matchScore}%
            </div>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Tour Details & Itinerary Ribbon */}
          <div className="lg:col-span-8 space-y-8">
            {/* Hero Image & Metadata Chips */}
            <div className="bg-white border border-[#c3c6ce] rounded-2xl overflow-hidden shadow-xs">
              <div className="h-64 bg-[#d8dadd] relative overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${review.heroImage}')` }}
                />
                <div className="absolute top-4 left-4 bg-[#00152a]/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <span className="material-symbols-outlined text-[16px] text-[#71f8e4]">pedal_bike</span>
                  {review.category}
                </div>
              </div>

              <div className="p-6">
                {/* 4 Metadata Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#f7f9fc] border border-[#c3c6ce] p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-[#74777e] block">Giá khởi điểm</span>
                    <span className="text-base font-bold text-[#00152a]">{review.price}</span>
                  </div>

                  <div className="bg-[#f7f9fc] border border-[#c3c6ce] p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-[#74777e] block">Thời lượng</span>
                    <span className="text-base font-bold text-[#00152a]">{review.duration}</span>
                  </div>

                  <div className="bg-[#f7f9fc] border border-[#c3c6ce] p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-[#74777e] block">Quy mô đoàn</span>
                    <span className="text-base font-bold text-[#00152a]">Tối đa {review.maxPeople} khách</span>
                  </div>

                  <div className="bg-[#f7f9fc] border border-[#c3c6ce] p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-[#74777e] block">Ngôn ngữ</span>
                    <span className="text-base font-bold text-[#00152a]">{review.languages}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#00152a] mb-2">Tổng quan Tour</h3>
                <p className="text-sm text-[#43474d] leading-relaxed mb-6">
                  {review.overview}
                </p>
              </div>
            </div>

            {/* Itinerary Timeline with Route Ribbon */}
            <div className="bg-white border border-[#c3c6ce] rounded-2xl p-6 shadow-xs">
              <h3 className="text-lg font-bold text-[#00152a] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006b5f]">route</span>
                Lộ trình chi tiết & Điểm dừng
              </h3>

              <div className="relative space-y-6 ml-2">
                <div className="absolute left-[19px] top-4 bottom-8 w-[3px] bg-[#c3c6ce] z-0" />

                {review.itinerary.map((node) => (
                  <div key={node.id} className="relative flex items-start gap-4 z-10">
                    <div className="w-10 h-10 rounded-full bg-[#00152a] text-white flex items-center justify-center shrink-0 border-2 border-white shadow-xs">
                      <span className="material-symbols-outlined text-lg">{node.icon}</span>
                    </div>

                    <div className="flex-1 bg-[#f7f9fc] border border-[#c3c6ce] rounded-xl p-4">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-[11px] font-bold text-[#006b5f] uppercase tracking-wider">
                            {node.category}
                          </span>
                          <h4 className="font-bold text-base text-[#00152a]">{node.title}</h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#00152a] bg-[#eceef1] px-2 py-1 rounded-md">
                          {node.time}
                        </span>
                      </div>

                      <p className="text-xs text-[#43474d] leading-relaxed mt-2">{node.description}</p>

                      {node.warning && (
                        <div className="mt-3 p-3 bg-[#ffdad4] border border-[#e96755]/40 rounded-xl text-xs text-[#872015] flex items-start gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#ff7043] shrink-0">
                            warning
                          </span>
                          <span>{node.warning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Moderation Action Panel */}
          <div className="lg:col-span-4 space-y-6">
            {/* Operator Card */}
            <div className="bg-white border border-[#c3c6ce] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cover bg-center border border-[#c3c6ce]" style={{ backgroundImage: `url('${review.operatorAvatar}')` }} />
                <div>
                  <h4 className="font-bold text-sm text-[#00152a]">{review.operatorName}</h4>
                  <p className="text-xs text-[#006b5f] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {review.rating} • {review.activeTours} tour đang mở
                  </p>
                </div>
              </div>
            </div>

            <TourReviewDecisionPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
