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
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectCity(cityId);
    }
  }

  return (
    <section
      id="destinations"
      className="scroll-mt-20 py-12 sm:py-16 bg-[#fafbfc] px-4 sm:px-8 border-b border-slate-200"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header: Clean Editorial Travel Hierarchy */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-8 border-b border-slate-200">
          <div>
            <EditorialTextReveal delay={40} duration={400}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#007d6e] mb-2.5">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  location_on
                </span>
                <span>Khám phá điểm đến Miền Trung</span>
              </div>
            </EditorialTextReveal>

            <EditorialTextReveal delay={120} duration={480}>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#00152a] tracking-tight text-balance">
                Ba Điểm Đến Biểu Tượng Miền Trung
              </h2>
            </EditorialTextReveal>

            <EditorialTextReveal delay={200} duration={480}>
              <p className="mt-2.5 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed text-pretty">
                Hệ sinh thái điểm đến tại Đà Nẵng, Hội An và Cố Đô Huế với địa danh đặc sắc,
                giờ hoạt động chuẩn xác và trải nghiệm bản địa phong phú.
              </p>
            </EditorialTextReveal>
          </div>

          <EditorialTextReveal delay={260} duration={450}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                  verified
                </span>
                <span>Điểm đến chọn lọc</span>
              </span>
            </div>
          </EditorialTextReveal>
        </div>

        {/* Destination Cards Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {CENTRAL_DESTINATIONS.map((dest, index) => {
            const isCurrentActive = activeCity === dest.id;

            return (
              <CardReveal
                key={dest.id}
                delay={index * 120}
                duration={500}
                className="h-full"
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Chọn điểm đến ${dest.name}`}
                  onKeyDown={(e) => handleCardKeyDown(e, dest.id)}
                  onClick={() => handleSelectCity(dest.id)}
                  className="relative h-full group cursor-pointer focus-visible:outline-hidden"
                >
                  <div
                    className={`relative z-10 h-full rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col focus-visible:ring-2 focus-visible:ring-[#007d6e] ${
                      isCurrentActive
                        ? 'border-[#007d6e] ring-2 ring-[#007d6e]/20 shadow-md'
                        : 'border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {/* Active City Indicator Badge */}
                    {isCurrentActive && (
                      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#007d6e] text-white shadow-sm border border-white/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                          <span>Đang chọn</span>
                        </span>
                      </div>
                    )}

                    {/* Image Header with Aspect Ratio & Overlays */}
                    <div className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden bg-slate-900">
                      <img
                        src={dest.image}
                        alt={`Thắng cảnh tại ${dest.name}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                      {/* Top Left Badge */}
                      <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/95 text-slate-900 backdrop-blur-md shadow-xs">
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

                      {/* City Name on Bottom of Image */}
                      <div className="absolute bottom-3.5 left-4 right-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{dest.name}</h3>
                        <p className="text-xs text-slate-200 font-medium mt-0.5">{dest.tagline}</p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                      <div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {dest.description}
                        </p>

                        {/* Top POIs List */}
                        <div className="mt-4 pt-3.5 border-t border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                            Điểm đến tiêu biểu:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {dest.topPois.map((poi) => (
                              <span
                                key={poi}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium hover:bg-teal-50 hover:text-[#007d6e] transition-colors"
                              >
                                {poi}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Stats & Link */}
                      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/60 text-[#006B5F]">
                            <span className="material-symbols-outlined text-sm text-[#007d6e]" aria-hidden="true">
                              pin_drop
                            </span>
                            <strong className="font-bold text-[#004D40]">{dest.poisCount}</strong>
                            <span>POIs</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-800">
                            <span className="material-symbols-outlined text-sm text-amber-600" aria-hidden="true">
                              confirmation_number
                            </span>
                            <strong className="font-bold text-amber-900">{dest.toursCount}</strong>
                            <span>Tours</span>
                          </span>
                        </div>

                        <Link
                          href={ROUTES.pois}
                          aria-label={`Khám phá địa điểm tại ${dest.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#007d6e] hover:text-[#005f56] group-hover:translate-x-1 transition-transform cursor-pointer"
                        >
                          <span>Khám phá địa điểm</span>
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">
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
