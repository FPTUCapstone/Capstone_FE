/* eslint-disable @next/next/no-img-element */
'use client';

import type { KeyboardEvent } from 'react';
import Link from 'next/link';
import { CENTRAL_DESTINATIONS } from '@/data/landingData';
import { EditorialTextReveal, CardReveal } from '@/components/ui/ScrollReveal';
import { ROUTES } from '@/lib/routes';

interface CentralVietnamShowcaseProps {
  activeCity?: 'danang' | 'hoian' | 'hue';
  onSelectCity?: (city: 'danang' | 'hoian' | 'hue') => void;
}

export function CentralVietnamShowcase({ activeCity, onSelectCity }: CentralVietnamShowcaseProps) {
  function handleSelectCity(cityId: string) {
    if (onSelectCity && (cityId === 'danang' || cityId === 'hoian' || cityId === 'hue')) {
      onSelectCity(cityId);
    }
    window.dispatchEvent(new CustomEvent('tripmate:select-city', { detail: cityId }));
  }

  function handleCardKeyDown(e: KeyboardEvent<HTMLDivElement>, cityId: string) {
    if (e.target !== e.currentTarget) {
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectCity(cityId);
    }
  }

  return (
    <section
      id="destinations"
      className="scroll-mt-20 py-12 sm:py-16 bg-[#F7F5EF] px-3 sm:px-6 lg:px-8 border-b border-[#DCE2DD]"
    >
      <div className="mx-auto max-w-7xl xl:max-w-[1440px]">
        {/* Section Header: Clean Editorial Travel Hierarchy */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-8 border-b border-[#DCE2DD]">
          <div>
            <EditorialTextReveal delay={40} duration={400}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#103B39] mb-2.5">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  location_on
                </span>
                <span>Khám phá điểm đến Miền Trung</span>
              </div>
            </EditorialTextReveal>

            <EditorialTextReveal delay={120} duration={480}>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#1C2928] tracking-tight text-balance">
                Ba Điểm Đến Biểu Tượng Miền Trung
              </h2>
            </EditorialTextReveal>

            <EditorialTextReveal delay={200} duration={480}>
              <p className="mt-2.5 text-[#5B6E69] text-sm sm:text-base max-w-2xl leading-relaxed text-pretty">
                Hệ sinh thái điểm đến tại Đà Nẵng, Hội An và Cố Đô Huế với địa danh đặc sắc,
                giờ hoạt động chuẩn xác và trải nghiệm bản địa phong phú.
              </p>
            </EditorialTextReveal>
          </div>

          <EditorialTextReveal delay={260} duration={450}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#5B6E69] bg-white border border-[#DCE2DD] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-sm text-[#103B39]" aria-hidden="true">
                  verified
                </span>
                <span>Điểm đến chọn lọc</span>
              </span>
            </div>
          </EditorialTextReveal>
        </div>

        {/* Destination Cards: Full-Width Stacked Landscape Architecture */}
        <div className="mt-8 space-y-5 lg:space-y-6">
          {CENTRAL_DESTINATIONS.map((dest, index) => {
            const isCurrentActive = activeCity === dest.id;

            return (
              <CardReveal
                key={dest.id}
                delay={index * 120}
                duration={500}
                className="w-full"
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Chọn điểm đến ${dest.name}`}
                  onKeyDown={(e) => handleCardKeyDown(e, dest.id)}
                  onClick={() => handleSelectCity(dest.id)}
                  className="relative w-full rounded-2xl group cursor-pointer focus-visible:outline-hidden"
                >
                  <div
                    className={`relative z-10 w-full rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row focus-visible:ring-2 focus-visible:ring-[#103B39] ${
                      isCurrentActive
                        ? 'border-[#174B4A] ring-2 ring-[#174B4A]/20 shadow-md'
                        : 'border-[#DCE2DD] hover:border-[#103B39]'
                    }`}
                  >
                    {/* Left: Scenic Destination Image (~35–38%) */}
                    <div className="relative w-full md:w-[36%] lg:w-[35%] shrink-0 aspect-16/10 md:aspect-auto min-h-[220px] md:min-h-[260px] overflow-hidden bg-slate-900">
                      <img
                        src={dest.image}
                        alt={`Thắng cảnh tại ${dest.name}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none" />

                      {/* Top Left Badge */}
                      <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/95 text-[#1C2928] backdrop-blur-md shadow-xs">
                          {dest.badge}
                        </span>
                      </div>

                      {/* Top Right Weather Pill */}
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-black/60 text-white/95 backdrop-blur-md">
                        <span className="material-symbols-outlined text-xs text-amber-300" aria-hidden="true">
                          wb_sunny
                        </span>
                        <span>{dest.temp}</span>
                      </div>
                    </div>

                    {/* Right: Information & Storytelling (~64–65%) */}
                    <div className="flex-1 p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        {/* Header Tier: Title, Active Badge & Stats Row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl sm:text-2xl font-black text-[#1C2928] tracking-tight group-hover:text-[#103B39] transition-colors">
                                {dest.name}
                              </h3>
                              {isCurrentActive && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8F0EA] text-[#174B4A] border border-[#174B4A]/20">
                                  Active Destination
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-[#5B6E69] mt-0.5">{dest.tagline}</p>
                          </div>

                          {/* Stats Badges */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8F0EA] border border-[#174B4A]/30 text-[#174B4A] text-xs font-semibold">
                              <span className="material-symbols-outlined text-sm text-[#103B39]" aria-hidden="true">
                                pin_drop
                              </span>
                              <strong className="font-bold text-[#174B4A]">{dest.poisCount}</strong>
                              <span className="text-[11px] text-[#5B6E69]">POIs</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50/90 border border-amber-200/70 text-amber-800 text-xs font-semibold">
                              <span className="material-symbols-outlined text-sm text-amber-600" aria-hidden="true">
                                confirmation_number
                              </span>
                              <strong className="font-bold text-amber-900">{dest.toursCount}</strong>
                              <span className="text-[11px] text-amber-700/80">Tours</span>
                            </span>
                          </div>
                        </div>

                        {/* Editorial Narrative */}
                        <p className="text-xs sm:text-sm text-[#5B6E69] leading-relaxed text-pretty">
                          {dest.description}
                        </p>

                        {/* Top POIs Chips */}
                        <div className="pt-2">
                          <span className="text-[11px] font-semibold text-[#5B6E69] block mb-2">
                            Điểm đến tiêu biểu:
                          </span>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {dest.topPois.map((poi) => (
                              <span
                                key={poi}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-[#1C2928] text-xs font-medium hover:bg-[#E8F0EA] hover:text-[#103B39] transition-colors border border-[#DCE2DD]"
                              >
                                {poi}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Row: Data verification on left, CTA on right */}
                      <div className="pt-4 border-t border-[#DCE2DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-[#5B6E69]">
                          <span className="material-symbols-outlined text-sm text-[#103B39]" aria-hidden="true">
                            travel_explore
                          </span>
                          <span>Khám phá điểm đến miền Trung</span>
                        </div>

                        <Link
                          href={ROUTES.pois}
                          aria-label={`Khám phá địa điểm tại ${dest.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                          }}
                          className="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-[#103B39] hover:text-white text-[#103B39] text-xs font-bold border border-[#DCE2DD] hover:border-[#103B39] flex items-center justify-center gap-2 transition-all cursor-pointer group/btn shadow-2xs"
                        >
                          <span>Khám phá địa điểm {dest.name}</span>
                          <span
                            className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1"
                            aria-hidden="true"
                          >
                            arrow_forward
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
