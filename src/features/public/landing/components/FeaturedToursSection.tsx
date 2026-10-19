/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { VERIFIED_TOURS, VerifiedTour } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { LandingEyebrow } from './LandingEyebrow';

export function FeaturedToursSection() {
  const [filterCity, setFilterCity] = useState<'all' | 'Đà Nẵng' | 'Hội An' | 'Huế'>('all');
  const [selectedTour, setSelectedTour] = useState<VerifiedTour | null>(null);

  const filtered = filterCity === 'all'
    ? VERIFIED_TOURS
    : VERIFIED_TOURS.filter((t) => t.city === filterCity);

  function handleOpenTour(tour: VerifiedTour) {
    setSelectedTour(tour);
  }

  function handleCloseModal() {
    setSelectedTour(null);
  }

  return (
    <section id="tours" className="scroll-mt-20 py-16 sm:py-24 bg-[#f4f7fc] px-4 sm:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
            <div>
              <LandingEyebrow icon="verified" className="mb-3">
                Tour bản địa được bảo chứng
              </LandingEyebrow>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#00152a] tracking-tight">
                Tour Trải Nghiệm Bản Địa <span className="text-[#007d6e]">Đã Kiểm Duyệt</span>
              </h2>
              <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed text-pretty">
                Trực tiếp từ các nhà tổ chức tour (Tour Operators) uy tín tại Miền Trung. 
                Tích hợp vé điện tử Dynamic QR và thanh toán ký quỹ Escrow minh bạch.
              </p>
            </div>

            {/* Filter Pills & View All Link */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setFilterCity('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer btn-press ${
                    filterCity === 'all'
                      ? 'bg-[#00152a] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({VERIFIED_TOURS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCity('Đà Nẵng')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer btn-press ${
                    filterCity === 'Đà Nẵng'
                      ? 'bg-[#007d6e] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đà Nẵng
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCity('Hội An')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer btn-press ${
                    filterCity === 'Hội An'
                      ? 'bg-[#d97706] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hội An
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCity('Huế')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer btn-press ${
                    filterCity === 'Huế'
                      ? 'bg-[#7c3aed] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cố Đô Huế
                </button>
              </div>

              <Link
                href={ROUTES.tours}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-[#007d6e] hover:text-teal-800 transition"
              >
                <span>Xem tất cả tour</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((tour, idx) => (
            <ScrollReveal
              key={tour.id}
              animation="fade-up"
              delay={idx * 120}
              duration={700}
            >
              <div className="tilt-card bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-teal-300 card-hover-lift transition-all duration-300 flex flex-col group h-full">
                {/* Tour Hero Image */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-900 backdrop-blur-md shadow-xs">
                    {tour.tag}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#00152a]/80 text-teal-300 backdrop-blur-md shadow-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-teal-300">verified</span>
                    <span>Đã kiểm duyệt</span>
                  </span>
                </div>

                {/* Tour Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span className="font-semibold text-slate-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#007d6e]">storefront</span>
                        {tour.operator}
                      </span>
                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                        ★ {tour.rating}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#00152a] line-clamp-2 group-hover:text-[#007d6e] transition-colors">
                      {tour.title}
                    </h3>

                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {tour.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">pin_drop</span>
                        {tour.city}
                      </span>
                    </div>

                    {/* Highlights */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tour.highlights.slice(0, 2).map((h) => (
                        <span key={h} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Giá từ:</span>
                      <span className="text-base font-black text-[#007d6e]">{tour.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenTour(tour)}
                      className="px-3.5 py-2 rounded-xl bg-[#00152a] hover:bg-[#007d6e] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 btn-press"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Tour Detail & Booking Modal */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header Image */}
            <div className="relative aspect-video overflow-hidden rounded-t-3xl bg-slate-100">
              <img
                src={selectedTour.image}
                alt={selectedTour.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Đóng cửa sổ"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-teal-600 text-white shadow-xs">
                  {selectedTour.operatorBadge}
                </span>
                <h3 className="text-lg font-black mt-2 leading-tight drop-shadow-md">
                  {selectedTour.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5">
              {/* Meta stats */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Đơn vị tổ chức:</span>
                  <strong className="text-slate-900 font-bold">{selectedTour.operator}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Thời lượng:</span>
                  <strong className="text-slate-900 font-bold">{selectedTour.duration}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Đánh giá:</span>
                  <strong className="text-amber-600 font-bold">
                    ★ {selectedTour.rating} ({selectedTour.reviewCount})
                  </strong>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Trải nghiệm bao gồm:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                  {selectedTour.highlights.map((h) => (
                    <div
                      key={h}
                      className="flex items-center gap-1.5 p-2 rounded-xl bg-teal-50/60 border border-teal-100 font-medium"
                    >
                      <span className="material-symbols-outlined text-sm text-[#007d6e]">check_circle</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Escrow Capability Note */}
              <div className="p-4 rounded-2xl bg-[#00152a] text-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-teal-300">verified_user</span>
                  <div>
                    <p className="text-xs font-bold text-white">Bảo chứng TripMate Escrow</p>
                    <p className="text-[11px] text-slate-300">
                      Thanh toán bảo đảm qua cổng đối tác • Hoàn tiền theo chính sách khi hủy chuyến do thời tiết
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-teal-400/20 text-teal-300 border border-teal-400/30 shrink-0">
                  Đã kiểm duyệt
                </span>
              </div>

              {/* Price & Action */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Giá từ:</span>
                  <span className="text-2xl font-black text-[#007d6e]">{selectedTour.price}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                  <Link
                    href={ROUTES.tours}
                    className="px-6 py-2.5 rounded-xl bg-[#007d6e] hover:bg-[#006b5f] text-white text-xs font-bold transition shadow-md shadow-teal-700/25 cursor-pointer flex items-center gap-2 btn-press"
                  >
                    <span>Khám phá tour &amp; Lịch khởi hành</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
